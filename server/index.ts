import 'dotenv/config';

import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);
import crypto from 'node:crypto';
import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import cors from 'cors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import {
  MongoClient,
  type Db,
} from 'mongodb';

import type {
  Complaint,
  ComplaintStatus,
  UserRole,
} from '../src/types';
import { DEMO_USERS, INITIAL_COMPLAINTS } from '../src/data/demoData';

dns.setDefaultResultOrder('ipv4first');

const app = express();

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DATABASE_NAME = 'roadwatch';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'https://roadwatch-web-9izo.onrender.com',
];

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
}

interface UserDocument {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

interface ComplaintDocument {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  ward: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reportedAt: string;
  updatedAt: string;
  citizenName: string;
  citizenPhoneMasked?: string;
  assignedCrew?: string;
  workNotes?: string;
  materialDetails?: string;
  evidence?: Record<string, unknown>;
  feedback?: Record<string, unknown>;
  endorsementsCount?: number;
  commentsCount?: number;
  comments?: ComplaintComment[];
  [key: string]: any;
}

/*
 * MongoDB's generic update types can reject valid nested $push updates
 * when the document interface contains optional arrays.
 *
 * This collection type keeps the update operations usable while the
 * application validates request data before writing to MongoDB.
 */
type ComplaintCollection = {
  findOne: (...args: any[]) => Promise<any>;
  find: (...args: any[]) => any;
  insertOne: (...args: any[]) => Promise<any>;
  updateOne: (...args: any[]) => Promise<any>;
  deleteMany: (...args: any[]) => Promise<any>;
  createIndex: (...args: any[]) => Promise<any>;
};

type UserCollection = {
  findOne: (...args: any[]) => Promise<any>;
  insertOne: (...args: any[]) => Promise<any>;
  createIndex: (...args: any[]) => Promise<any>;
};

declare module 'express-session' {
  interface SessionData {
    user?: PublicUser;
  }
}

let mongoClient: MongoClient | undefined;
let database: Db | undefined;
let usersCollection: UserCollection | undefined;
let complaintsCollection: ComplaintCollection | undefined;
let sessionMiddleware: express.RequestHandler | undefined;

const SESSION_COOKIE_NAME = 'roadwatch.sid';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (!sessionMiddleware) {
    res.status(503).json({
      success: false,
      message: 'Server session service is initializing. Please retry in a moment.',
    });
    return;
  }
  sessionMiddleware(req, res, next);
});

function getUsersCollection(): UserCollection {
  if (!usersCollection) {
    throw new Error('The user database is not initialized.');
  }

  return usersCollection;
}

function getComplaintsCollection(): ComplaintCollection {
  if (!complaintsCollection) {
    throw new Error('The complaint database is not initialized.');
  }

  return complaintsCollection;
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function createComplaintId(): string {
  const year = new Date().getFullYear();
  return `RW-${year}-${crypto.randomInt(1000, 9999)}`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected server error occurred.';
}

function isValidString(
  value: unknown,
  maxLength = 5000,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function isValidRole(value: unknown): value is UserRole {
  return (
    value === 'citizen' ||
    value === 'authority' ||
    value === 'field_crew' ||
    value === 'admin'
  );
}

function publicUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.ward ? { ward: user.ward } : {}),
    ...(user.department ? { department: user.department } : {}),
    ...(user.phone ? { phone: user.phone } : {}),
  };
}

function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.user) {
    res.status(401).json({
      success: false,
      message: 'Please log in to continue.',
    });
    return;
  }

  next();
}

function requireRoles(...roles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const user = req.session.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Please log in to continue.',
      });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.',
      });
      return;
    }

    next();
  };
}

function makeComment(
  author: string,
  role: string,
  text: string,
): ComplaintComment {
  return {
    id: crypto.randomUUID(),
    author,
    role,
    text,
    timestamp: new Date().toISOString(),
  };
}

function cleanComplaint(
  complaint: Record<string, any>,
): Record<string, any> {
  const { _id, ...cleaned } = complaint;
  return cleaned;
}

function parseImageData(
  value: unknown,
): { mimeType: string; base64: string } | null {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/,
  );

  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64 = match[2];

  let bytes: Buffer;

  try {
    bytes = Buffer.from(base64, 'base64');
  } catch {
    return null;
  }

  if (bytes.length === 0 || bytes.length > 8 * 1024 * 1024) {
    return null;
  }

  const validSignature =
    (mimeType === 'image/jpeg' &&
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (mimeType === 'image/png' &&
      bytes.length >= 8 &&
      bytes.subarray(0, 8).equals(
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47,
          0x0d, 0x0a, 0x1a, 0x0a,
        ]),
      )) ||
    (mimeType === 'image/webp' &&
      bytes.length >= 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP');

  if (!validSignature) {
    return null;
  }

  return { mimeType, base64 };
}

/* ------------------------------ Health ------------------------------ */

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'RoadWatch API',
    database: database ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

/* -------------------------- Authentication -------------------------- */

app.post(
  '/api/auth/register',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role } = req.body ?? {};

      if (!isValidString(name, 100)) {
        res.status(400).json({
          success: false,
          message: 'Enter a valid name.',
        });
        return;
      }

      if (
        !isValidString(email, 254) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        res.status(400).json({
          success: false,
          message: 'Enter a valid email address.',
        });
        return;
      }

      if (
        typeof password !== 'string' ||
        password.length < 8 ||
        password.length > 128
      ) {
        res.status(400).json({
          success: false,
          message: 'Password must contain 8 to 128 characters.',
        });
        return;
      }

      /*
       * Public registration supports citizen and municipal authority demo accounts.
       */
      const selectedRole: UserRole = role === 'authority' ? 'authority' : 'citizen';

      const users = getUsersCollection();
      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await users.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
        return;
      }

      const now = new Date().toISOString();

      const user: UserDocument = {
        id: createId('USR'),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: selectedRole,
        ...(req.body.ward && isValidString(req.body.ward, 100) ? { ward: req.body.ward.trim() } : {}),
        ...(req.body.phone && isValidString(req.body.phone, 30) ? { phone: req.body.phone.trim() } : {}),
        createdAt: now,
        updatedAt: now,
      };

      await users.insertOne(user);

      req.session.user = publicUser(user);

      res.status(201).json({
        success: true,
        user: publicUser(user),
        message: 'Account created successfully.',
      });
    } catch (error) {
      console.error('Registration error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to create the account.',
      });
    }
  },
);

app.post(
  '/api/auth/demo-login',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { role, email } = req.body ?? {};

      const demoEmailByRole: Record<string, string> = {
        citizen: 'ananya.sharma@domain.in',
        authority: 's.nambiar@ward112.gov.in',
        field_crew: 'crew.bravo@roadscorp.org',
        admin: 'admin@roadwatch.demo',
      };

      let targetEmail: string | undefined;

      if (typeof email === 'string' && Object.values(demoEmailByRole).includes(email.trim().toLowerCase())) {
        targetEmail = email.trim().toLowerCase();
      } else if (typeof role === 'string' && demoEmailByRole[role]) {
        targetEmail = demoEmailByRole[role];
      }

      if (!targetEmail) {
        res.status(400).json({
          success: false,
          message: 'Specify a valid demonstration role: citizen, authority, field_crew, or admin.',
        });
        return;
      }

      const users = getUsersCollection();
      const user = (await users.findOne({
        email: targetEmail,
      })) as UserDocument | null;

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Demonstration account was not found in the database.',
        });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });

      req.session.user = publicUser(user);

      res.json({
        success: true,
        user: publicUser(user),
        message: `Signed in as demonstration ${user.role} (${user.name}).`,
      });
    } catch (error) {
      console.error('Demo login error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to sign in as demo account.',
      });
    }
  },
);

app.post(
  '/api/auth/login',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};

      if (
        !isValidString(email, 254) ||
        typeof password !== 'string' ||
        password.length === 0
      ) {
        res.status(400).json({
          success: false,
          message: 'Enter your email and password.',
        });
        return;
      }

      const users = getUsersCollection();

      const user = (await users.findOne({
        email: email.trim().toLowerCase(),
      })) as UserDocument | null;

      if (
        !user ||
        !(await bcrypt.compare(password, user.passwordHash))
      ) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      req.session.user = publicUser(user);

      res.json({
        success: true,
        user: publicUser(user),
        message: 'Login successful.',
      });
    } catch (error) {
      console.error('Login error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to log in.',
      });
    }
  },
);

app.get(
  '/api/auth/me',
  (req: Request, res: Response): void => {
    if (!req.session.user) {
      res.status(401).json({
        success: false,
        message: 'You are not logged in.',
      });
      return;
    }

    res.json({
      success: true,
      user: req.session.user,
    });
  },
);

app.post(
  '/api/auth/logout',
  (req: Request, res: Response): void => {
    req.session.destroy((error) => {
      if (error) {
        res.status(500).json({
          success: false,
          message: 'Unable to log out.',
        });
        return;
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      res.json({
        success: true,
        message: 'Logged out successfully.',
      });
    });
  },
);


/* ----------------------------- AI Analysis ----------------------------- */

app.post(
  '/api/ai/analyze-issue',
  requireRoles('citizen'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!GEMINI_API_KEY) {
        res.status(503).json({
          success: false,
          message: 'AI analysis is not configured on this server.',
        });
        return;
      }

      const { image: imageValue, description } = req.body ?? {};

      // Description is optional: AI can analyze the image by itself.
      if (
        (description !== undefined &&
          description !== null &&
          typeof description !== 'string') ||
        (typeof description === 'string' &&
          description.trim().length > 3000)
      ) {
        res.status(400).json({
          success: false,
          message: 'The description must be 3,000 characters or fewer.',
        });
        return;
      }

      const userDescription =
        typeof description === 'string' ? description.trim() : '';

      const imageData = parseImageData(imageValue);

      if (!imageData) {
        res.status(400).json({
          success: false,
          message:
            'Upload a valid JPEG, PNG, or WebP image under 8 MB.',
        });
        return;
      }

      const prompt = `
You assist with preliminary civic infrastructure issue reporting.

${userDescription
  ? `User-provided description: ${userDescription}`
  : 'No description was provided. Analyze the attached image and generate a concise description based only on visible details.'}

Analyze the attached image. Return only a valid JSON object with these fields:
{
  "category": "Potholes | Streetlights | Drainage | Open Manholes | Water Leaks | Debris & Floods",
  "severity": "Low | Medium | High | Critical",
  "title": "short issue title",
  "summary": "clear description of the visible issue",
  "suggestedAction": "reasonable suggested next step",
  "confidence": 0.0
}

Use the image as the primary evidence. If a user description is supplied,
use it as additional context, but do not assume unverified details are true.
Do not invent the location, time, identity of the reporter, or whether
a repair has occurred. If the image is unclear or the issue cannot be
identified, explain that in the summary and choose the closest reasonable
category. Treat all results as suggestions requiring human review.
`;

      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash-lite',
      ];

      let text = '';

      for (const model of modelsToTry) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
              encodeURIComponent(GEMINI_API_KEY),
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      {
                        inline_data: {
                          mime_type: imageData.mimeType,
                          data: imageData.base64,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.2,
                  responseMimeType: 'application/json',
                },
              }),
            },
          );

          if (response.ok) {
            const result = (await response.json()) as any;
            text =
              result?.candidates?.[0]?.content?.parts
                ?.map((part: any) => part.text ?? '')
                .join('') || '';

            if (text) break;
          }
        } catch {
          // Continue to next model on network/timeout error
        }
      }

      if (!text) {
        res.status(502).json({
          success: false,
          message:
            'AI analysis is temporarily unavailable. Please proceed by entering issue details manually.',
        });
        return;
      }

      let analysis: Record<string, unknown>;

      try {
        analysis = JSON.parse(text);
      } catch {
        console.error('Gemini returned invalid JSON:', text);

        res.status(502).json({
          success: false,
          message: 'The AI returned an invalid analysis format.',
        });
        return;
      }

      res.json({
        success: true,
        analysis,
        disclaimer:
          'AI suggestions may be incorrect and must be reviewed by a person.',
      });
    } catch (error) {
      console.error('AI analysis error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to analyze this issue.',
      });
    }
  },
);

/* --------------------------- Complaint Read --------------------------- */

app.get(
  '/api/complaints',
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const complaints = getComplaintsCollection();

      const records = await complaints
        .find({})
        .sort({ reportedAt: -1 })
        .toArray();

      res.json({
        success: true,
        complaints: records.map((record: any) =>
          cleanComplaint(record),
        ),
      });
    } catch (error) {
      console.error('Get complaints error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to load complaints.',
      });
    }
  },
);

app.get(
  '/api/complaints/:id',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const complaints = getComplaintsCollection();

      const complaint = await complaints.findOne({
        id: req.params.id,
      });

      if (!complaint) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        complaint: cleanComplaint(complaint),
      });
    } catch (error) {
      console.error('Get complaint error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to load the complaint.',
      });
    }
  },
);

/* -------------------------- Complaint Creation -------------------------- */

app.post(
  '/api/complaints',
  requireRoles('citizen'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        category,
        description,
        severity,
        ward,
        locationName,
        coordinates,
        citizenPhoneMasked,
        evidence,
        jurisdictionSuggestion,
      } = req.body ?? {};

      const allowedCategories = [
        'Potholes',
        'Streetlights',
        'Drainage',
        'Open Manholes',
        'Water Leaks',
        'Debris & Floods',
      ];

      const allowedSeverities = [
        'Low',
        'Medium',
        'High',
        'Critical',
      ];

      if (
        !isValidString(title, 150) ||
        !isValidString(description, 3000) ||
        !allowedCategories.includes(category) ||
        !allowedSeverities.includes(severity) ||
        !isValidString(ward, 100) ||
        !isValidString(locationName, 300)
      ) {
        res.status(400).json({
          success: false,
          message: 'Complete all required complaint fields correctly.',
        });
        return;
      }

      const lat = Number(coordinates?.lat);
      const lng = Number(coordinates?.lng);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        res.status(400).json({
          success: false,
          message: 'Provide valid complaint coordinates.',
        });
        return;
      }

      const complaints = getComplaintsCollection();
      const now = new Date().toISOString();
      const user = req.session.user!;

      let generatedId = createComplaintId();
      for (let attempt = 0; attempt < 10; attempt++) {
        const existing = await complaints.findOne({ id: generatedId });
        if (!existing) break;
        generatedId = createComplaintId();
      }

      const complaint: ComplaintDocument = {
        id: generatedId,
        title: title.trim(),
        category,
        description: description.trim(),
        severity,
        status: 'Submitted',
        ward: ward.trim(),
        locationName: locationName.trim(),
        coordinates: { lat, lng },
        reportedAt: now,
        updatedAt: now,
        citizenName: user.name,
        ...(isValidString(citizenPhoneMasked, 30)
          ? { citizenPhoneMasked: citizenPhoneMasked.trim() }
          : {}),
        evidence: evidence && typeof evidence === 'object' ? evidence : {
          beforePhotoUrl: '',
          beforeTimestamp: now,
          beforeCoordinates: {
            lat,
            lng,
            address: locationName.trim(),
          },
        },
        ...(jurisdictionSuggestion ? { jurisdictionSuggestion } : {}),
        reportedByUserId: user.id,
        isDemoData: false,
        endorsementsCount: 0,
        commentsCount: 0,
        comments: [],
      };

      await complaints.insertOne(complaint);

      res.status(201).json({
        success: true,
        id: complaint.id,
        complaint: cleanComplaint(complaint),
        message: 'Complaint submitted successfully.',
      });
    } catch (error) {
      console.error('Create complaint error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to submit the complaint.',
      });
    }
  },
);

/* ----------------------------- Status Update ----------------------------- */

app.patch(
  '/api/complaints/:id/status',
  requireRoles('authority', 'admin', 'field_crew'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, note } = req.body ?? {};
      const user = req.session.user!;

      // Field crew can only mark tasks as In Progress
      if (user.role === 'field_crew' && status !== 'In Progress') {
        res.status(403).json({
          success: false,
          message: 'Field crew can only update status to In Progress.',
        });
        return;
      }

      const allowedStatuses: ComplaintStatus[] = [
        'Submitted',
        'Under Review',
        'Assigned',
        'In Progress',
        'Evidence Submitted',
        'Authority Review',
        'Resolved',
        'Reopened',
        'Flagged for Audit',
      ];

      if (!allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid complaint status.',
        });
        return;
      }

      if (note !== undefined && !isValidString(note, 1000)) {
        res.status(400).json({
          success: false,
          message: 'The status note is invalid.',
        });
        return;
      }

      const complaints = getComplaintsCollection();

      const update: Record<string, any> = {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      };

      const auditNote = note?.trim() || `Status updated to "${status}" by ${user.name} (${user.role}).`;
      update.$push = {
        comments: makeComment(user.name, user.role, auditNote),
      };
      update.$inc = { commentsCount: 1 };

      const result = await complaints.updateOne(
        { id: req.params.id },
        update,
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        message: `Complaint status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Status update error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to update complaint status.',
      });
    }
  },
);

/* ----------------------------- Crew Assignment ----------------------------- */

app.patch(
  '/api/complaints/:id/crew',
  requireRoles('authority', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { assignedCrew, note } = req.body ?? {};

      let crewObj: Record<string, any>;
      let crewDisplayName: string;

      if (
        typeof assignedCrew === 'object' &&
        assignedCrew !== null &&
        typeof assignedCrew.name === 'string' &&
        assignedCrew.name.trim().length > 0
      ) {
        crewDisplayName = assignedCrew.name.trim();
        crewObj = {
          id: assignedCrew.id || `crew-${createId('CRW')}`,
          name: crewDisplayName,
          leadForeman: assignedCrew.leadForeman || 'Lead Foreman',
          phone: assignedCrew.phone || '+91 94481 02931',
          membersCount: Number(assignedCrew.membersCount) || 4,
        };
      } else if (isValidString(assignedCrew, 150)) {
        crewDisplayName = assignedCrew.trim();
        crewObj = {
          id: `crew-${createId('CRW')}`,
          name: crewDisplayName,
          leadForeman: 'Lead Foreman',
          phone: '+91 94481 02931',
          membersCount: 4,
        };
      } else {
        res.status(400).json({
          success: false,
          message: 'Provide valid crew assignment information.',
        });
        return;
      }

      if (note !== undefined && !isValidString(note, 1000)) {
        res.status(400).json({
          success: false,
          message: 'The assignment note is invalid.',
        });
        return;
      }

      const complaints = getComplaintsCollection();
      const user = req.session.user!;

      const update: Record<string, any> = {
        $set: {
          assignedCrew: crewObj,
          status: 'Assigned',
          updatedAt: new Date().toISOString(),
        },
        $push: {
          comments: makeComment(
            user.name,
            user.role,
            note?.trim() || `Assigned to ${crewDisplayName}.`,
          ),
        },
        $inc: { commentsCount: 1 },
      };

      const result = await complaints.updateOne(
        { id: req.params.id },
        update,
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Crew assigned successfully.',
      });
    } catch (error) {
      console.error('Crew assignment error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to assign the crew.',
      });
    }
  },
);

/* ----------------------------- Repair Evidence ----------------------------- */

app.patch(
  '/api/complaints/:id/evidence',
  requireRoles('field_crew', 'authority', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { evidence, note } = req.body ?? {};

      if (
        !evidence ||
        typeof evidence !== 'object' ||
        Array.isArray(evidence)
      ) {
        res.status(400).json({
          success: false,
          message: 'Provide valid repair evidence.',
        });
        return;
      }

      if (note !== undefined && !isValidString(note, 1000)) {
        res.status(400).json({
          success: false,
          message: 'The evidence note is invalid.',
        });
        return;
      }

      const complaints = getComplaintsCollection();
      const user = req.session.user!;
      const existing = await complaints.findOne({ id: req.params.id });

      if (!existing) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      const mergedEvidence = {
        ...(existing.evidence || {}),
        ...evidence,
        afterTimestamp: evidence.afterTimestamp || new Date().toISOString(),
      };

      const update: Record<string, any> = {
        $set: {
          evidence: mergedEvidence,
          status: 'Evidence Submitted',
          updatedAt: new Date().toISOString(),
          ...(note ? { workNotes: note.trim() } : {}),
        },
        $push: {
          comments: makeComment(
            user.name,
            user.role,
            note?.trim() || 'Repair evidence submitted for authority review.',
          ),
        },
        $inc: { commentsCount: 1 },
      };

      await complaints.updateOne(
        { id: req.params.id },
        update,
      );

      res.json({
        success: true,
        message: 'Evidence submitted for authority review.',
      });
    } catch (error) {
      console.error('Evidence submission error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to submit repair evidence.',
      });
    }
  },
);

/* ----------------------------- Evidence Review ----------------------------- */

app.patch(
  '/api/complaints/:id/evidence-review',
  requireRoles('authority', 'admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { decision, note } = req.body ?? {};

      const statusByDecision: Record<string, ComplaintStatus> = {
        approve: 'Resolved',
        flag: 'Flagged for Audit',
        reject: 'Reopened',
      };

      const nextStatus = statusByDecision[decision];

      if (!nextStatus) {
        res.status(400).json({
          success: false,
          message: 'Decision must be approve, flag, or reject.',
        });
        return;
      }

      if (note !== undefined && !isValidString(note, 1000)) {
        res.status(400).json({
          success: false,
          message: 'The review note is invalid.',
        });
        return;
      }

      const complaints = getComplaintsCollection();
      const user = req.session.user!;

      const defaultNote: Record<string, string> = {
        approve: 'Authority approved the submitted repair evidence.',
        flag: 'Evidence flagged for further audit.',
        reject: 'Evidence rejected; further repair is required.',
      };

      const result = await complaints.updateOne(
        { id: req.params.id },
        {
          $set: {
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          },
          $push: {
            comments: makeComment(
              user.name,
              user.role,
              note?.trim() || defaultNote[decision],
            ),
          },
          $inc: { commentsCount: 1 },
        },
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        status: nextStatus,
        message: 'Evidence review completed.',
      });
    } catch (error) {
      console.error('Evidence review error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to review repair evidence.',
      });
    }
  },
);

/* ----------------------------- Citizen Feedback ----------------------------- */

app.post(
  '/api/complaints/:id/feedback',
  requireRoles('citizen'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        resolutionStatus,
        rating,
        durability,
        turnaroundSla,
        smsClarity,
        followUpPhotoUrl,
        testimonialText,
        publishPublicly,
        nominateCrew,
      } = req.body ?? {};

      const validResolutionStatuses = [
        'fully_repaired',
        'partially_repaired',
        'not_repaired',
      ];

      const validDurability = [
        'Needs Rework',
        'Passable',
        'High Standard',
        'Flawless Grade',
      ];

      const validTurnaround = [
        'Behind Schedule',
        'On-Time (Target Met)',
        'Ahead of Schedule (<30h)',
      ];

      const validSmsClarity = [
        'Unclear / Delayed SMS',
        'Clear & Informative',
        'Proactive Updates',
      ];

      if (
        !validResolutionStatuses.includes(resolutionStatus) ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5 ||
        !validDurability.includes(durability) ||
        !validTurnaround.includes(turnaroundSla) ||
        !validSmsClarity.includes(smsClarity)
      ) {
        res.status(400).json({
          success: false,
          message: 'Please provide valid feedback values.',
        });
        return;
      }

      if (
        testimonialText !== undefined &&
        testimonialText !== '' &&
        !isValidString(testimonialText, 2000)
      ) {
        res.status(400).json({
          success: false,
          message: 'The testimonial is invalid.',
        });
        return;
      }

      const feedback = {
        resolutionStatus,
        rating,
        durability,
        turnaroundSla,
        smsClarity,
        ...(typeof followUpPhotoUrl === 'string'
          ? { followUpPhotoUrl }
          : {}),
        testimonialText:
          typeof testimonialText === 'string'
            ? testimonialText.trim()
            : '',
        publishPublicly: publishPublicly === true,
        nominateCrew: nominateCrew === true,
        submittedAt: new Date().toISOString(),
        submittedBy: req.session.user!.id,
      };

      const complaints = getComplaintsCollection();
      const user = req.session.user!;

      const result = await complaints.updateOne(
        { id: req.params.id },
        {
          $set: {
            feedback,
            updatedAt: new Date().toISOString(),
          },
          $push: {
            comments: makeComment(
              user.name,
              user.role,
              'Citizen feedback submitted.',
            ),
          },
          $inc: { commentsCount: 1 },
        },
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        feedback,
        message: 'Feedback submitted successfully.',
      });
    } catch (error) {
      console.error('Citizen feedback error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to submit feedback.',
      });
    }
  },
);

/* ----------------------------- Endorsement ----------------------------- */

app.post(
  '/api/complaints/:id/endorse',
  requireRoles('citizen'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const complaints = getComplaintsCollection();

      const result = await complaints.updateOne(
        { id: req.params.id },
        {
          $inc: { endorsementsCount: 1 },
          $set: { updatedAt: new Date().toISOString() },
        },
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Complaint endorsed successfully.',
      });
    } catch (error) {
      console.error('Endorsement error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to endorse this complaint.',
      });
    }
  },
);

/* ----------------------------- Comments ----------------------------- */

app.post(
  '/api/complaints/:id/comments',
  requireAuthentication,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body ?? {};

      if (!isValidString(text, 2000)) {
        res.status(400).json({
          success: false,
          message: 'Enter a comment of up to 2,000 characters.',
        });
        return;
      }

      const complaints = getComplaintsCollection();
      const user = req.session.user!;

      const comment = makeComment(
        user.name,
        user.role,
        text.trim(),
      );

      const result = await complaints.updateOne(
        { id: req.params.id },
        {
          $push: { comments: comment },
          $inc: { commentsCount: 1 },
          $set: { updatedAt: new Date().toISOString() },
        },
      );

      if (result.matchedCount === 0) {
        res.status(404).json({
          success: false,
          message: 'Complaint not found.',
        });
        return;
      }

      res.status(201).json({
        success: true,
        comment,
        message: 'Comment added successfully.',
      });
    } catch (error) {
      console.error('Add comment error:', error);

      res.status(500).json({
        success: false,
        message: 'Unable to add the comment.',
      });
    }
  },
);

/* ----------------------------- Not Found ----------------------------- */

app.use(
  (req: Request, res: Response): void => {
    res.status(404).json({
      success: false,
      message: `API route not found: ${req.method} ${req.path}`,
    });
  },
);

/* ----------------------------- Error Handler ----------------------------- */

app.use(
  (
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    console.error('Unhandled server error:', error);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  },
);

/* ----------------------------- Server Startup ----------------------------- */

async function seedDemoData(): Promise<void> {
  const users = getUsersCollection();
  const complaints = getComplaintsCollection();
  const now = new Date().toISOString();
  const defaultPasswordHash = await bcrypt.hash('RoadWatch2025!', 10);

  for (const demoUser of DEMO_USERS) {
    const existing = await users.findOne({ email: demoUser.email.toLowerCase() });
    if (!existing) {
      await users.insertOne({
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email.toLowerCase(),
        passwordHash: defaultPasswordHash,
        role: demoUser.role,
        ward: demoUser.ward,
        department: demoUser.department,
        phone: demoUser.phone,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`Seeded demonstration account: ${demoUser.name} (${demoUser.email} / ${demoUser.role})`);
    }
  }

  for (const sample of INITIAL_COMPLAINTS) {
    const existing = await complaints.findOne({ id: sample.id });
    if (!existing) {
      await complaints.insertOne({
        ...sample,
        reportedAt: sample.reportedAt || now,
        updatedAt: sample.updatedAt || now,
        isDemoData: true,
      });
      console.log(`Seeded demonstration complaint: ${sample.id} (${sample.title})`);
    }
  }
}

async function startServer(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is missing from your server environment.',
    );
  }

  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to a value of at least 32 characters.',
    );
  }

  mongoClient = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  await mongoClient.connect();

  database = mongoClient.db(DATABASE_NAME);

  await database.command({ ping: 1 });

  usersCollection = database.collection(
    'users',
  ) as unknown as UserCollection;

  complaintsCollection = database.collection(
    'complaints',
  ) as unknown as ComplaintCollection;

  await getUsersCollection().createIndex(
    { email: 1 },
    { unique: true },
  );

  await getComplaintsCollection().createIndex(
    { id: 1 },
    { unique: true },
  );

  sessionMiddleware = session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      client: mongoClient,
      dbName: DATABASE_NAME,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });

  await seedDemoData();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RoadWatch API running on port ${PORT}`);
    console.log('MongoDB connected successfully.');
    console.log('Health check: /api/health');
  });
}

startServer().catch((error: unknown) => {
  console.error('Failed to start RoadWatch API:', getErrorMessage(error));
  process.exitCode = 1;
});
