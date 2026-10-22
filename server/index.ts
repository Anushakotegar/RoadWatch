
import 'dotenv/config';
import { setServers } from 'node:dns';
import { randomInt, randomUUID } from 'node:crypto';
import express from 'express';
import type { RequestHandler } from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import {
  MongoClient,
  Collection,
  Document,
} from 'mongodb';
import type { Complaint, UserRole } from '../src/types';

// Use Google's IPv6 DNS resolvers, which were reachable in the network test.
setServers([
  '[2001:4860:4860::8888]',
  '[2001:4860:4860::8844]',
]);

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

interface UserDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
  createdAt: string;
}

interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ward?: string;
  department?: string;
  phone?: string;
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const SESSION_SECRET = process.env.SESSION_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const SESSION_COOKIE = 'roadwatch.sid';

app.disable('x-powered-by');

if (IS_PRODUCTION) {
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '8mb' }));

app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Vary', 'Origin');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});

let usersCollection: Collection<UserDocument> | undefined;
let complaintsCollection: Collection<Document> | undefined;
let sessionMiddleware: RequestHandler | undefined;

app.use((req, res, next) => {
  if (!sessionMiddleware) {
    res.status(503).json({ error: 'Session service is not ready.' });
    return;
  }

  sessionMiddleware(req, res, next);
});

function publicUser(user: UserDocument): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ward: user.ward,
    department: user.department,
    phone: user.phone,
  };
}

const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Please sign in first.' });
    return;
  }

  next();
};

function validText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// Gemini AI image analysis for signed-in citizens.
// Suggestions do not verify a real-world issue.
app.post('/api/ai/analyze-issue', requireAuth, async (req, res) => {
  if (!usersCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  if (!GEMINI_API_KEY) {
    res.status(503).json({
      error: 'Gemini AI is not configured on the server.',
    });
    return;
  }

  try {
    const user = await usersCollection.findOne({
      id: req.session.userId,
    });

    if (!user) {
      res.status(401).json({ error: 'Please sign in again.' });
      return;
    }

    if (user.role !== 'citizen') {
      res.status(403).json({
        error: 'Only citizen accounts can request report analysis.',
      });
      return;
    }

    const {
      imageBase64,
      mimeType,
      reportDescription,
    } = req.body ?? {};

    if (
      typeof imageBase64 !== 'string' ||
      imageBase64.length === 0 ||
      imageBase64.length > 7_000_000
    ) {
      res.status(400).json({
        error: 'Please provide an image smaller than 5 MB.',
      });
      return;
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      typeof mimeType !== 'string' ||
      !allowedMimeTypes.includes(mimeType)
    ) {
      res.status(400).json({
        error: 'Use a JPEG, PNG, or WebP image.',
      });
      return;
    }

    if (
      reportDescription !== undefined &&
      (typeof reportDescription !== 'string' ||
        reportDescription.length > 2000)
    ) {
      res.status(400).json({
        error: 'The report description must be under 2000 characters.',
      });
      return;
    }

    let normalizedBase64 = imageBase64;
    let normalizedMimeType = mimeType;

    const dataUrlMatch = imageBase64.match(
      /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s,
    );

    if (dataUrlMatch) {
      normalizedMimeType = dataUrlMatch[1];
      normalizedBase64 = dataUrlMatch[2];
    }

    if (
      !/^[A-Za-z0-9+/]+={0,2}$/.test(normalizedBase64) ||
      normalizedBase64.length % 4 !== 0
    ) {
      res.status(400).json({
        error: 'The uploaded image data is invalid.',
      });
      return;
    }

    const imageBuffer = Buffer.from(normalizedBase64, 'base64');

    if (imageBuffer.length === 0 || imageBuffer.length > 5 * 1024 * 1024) {
      res.status(400).json({
        error: 'Please provide a valid image smaller than 5 MB.',
      });
      return;
    }

    const isJpeg =
      imageBuffer[0] === 0xff &&
      imageBuffer[1] === 0xd8 &&
      imageBuffer[2] === 0xff;

    const isPng =
      imageBuffer.length >= 8 &&
      imageBuffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      );

    const isWebp =
      imageBuffer.length >= 12 &&
      imageBuffer.toString('ascii', 0, 4) === 'RIFF' &&
      imageBuffer.toString('ascii', 8, 12) === 'WEBP';

    const signatureMatches =
      (normalizedMimeType === 'image/jpeg' && isJpeg) ||
      (normalizedMimeType === 'image/png' && isPng) ||
      (normalizedMimeType === 'image/webp' && isWebp);

    if (!signatureMatches) {
      res.status(400).json({
        error: 'The image contents do not match the selected file type.',
      });
      return;
    }

    const description =
      typeof reportDescription === 'string'
        ? reportDescription.trim()
        : '';

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = `
You assist citizens with drafting civic infrastructure reports.

Inspect the supplied image and optional citizen description.

Allowed categories:
- Potholes
- Streetlights
- Drainage
- Open Manholes
- Water Leaks
- Debris & Floods

Allowed severity values:
- Low
- Medium
- High
- Critical

Return one valid JSON object with exactly these fields:
{
  "suggestedCategory": "one allowed category",
  "suggestedSeverity": "one allowed severity",
  "observations": ["brief visible observation"],
  "suggestedDescription": "short factual draft based on the image",
  "recommendedAction": "reasonable next step for the citizen or authority",
  "limitations": "what cannot be confirmed from this image"
}

Rules:
- Only describe details that are visibly supported by the image.
- Consider the citizen description as context, not proof.
- Do not invent a location, measurements, damage depth, cause, or repair status.
- Do not claim an image is genuine or that an issue has been verified.
- Do not decide that an issue is an emergency solely from the image.
- If the image is unclear or unrelated, say so in observations and limitations.
- Severity is only a preliminary suggestion and requires human review.
- Return JSON only, with no Markdown fences.

Citizen's description:
${description || '(No description provided)'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: normalizedMimeType,
                data: normalizedBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 800,
      },
    });

    const responseText = response.text;

    if (!responseText) {
      res.status(502).json({
        error: 'Gemini did not return an analysis. Please try again.',
      });
      return;
    }

    let analysis: {
      suggestedCategory?: unknown;
      suggestedSeverity?: unknown;
      observations?: unknown;
      suggestedDescription?: unknown;
      recommendedAction?: unknown;
      limitations?: unknown;
    };

    try {
      analysis = JSON.parse(responseText);
    } catch {
      console.error('Gemini returned invalid JSON.');
      res.status(502).json({
        error: 'The AI response could not be processed. Please try again.',
      });
      return;
    }

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
      typeof analysis.suggestedCategory !== 'string' ||
      !allowedCategories.includes(analysis.suggestedCategory) ||
      typeof analysis.suggestedSeverity !== 'string' ||
      !allowedSeverities.includes(analysis.suggestedSeverity) ||
      !Array.isArray(analysis.observations) ||
      !analysis.observations.every(
        (item) => typeof item === 'string',
      ) ||
      typeof analysis.suggestedDescription !== 'string' ||
      typeof analysis.recommendedAction !== 'string' ||
      typeof analysis.limitations !== 'string'
    ) {
      res.status(502).json({
        error: 'The AI returned an unexpected response. Please try again.',
      });
      return;
    }

    res.json({
      analysis: {
        suggestedCategory: analysis.suggestedCategory,
        suggestedSeverity: analysis.suggestedSeverity,
        observations: analysis.observations.slice(0, 6),
        suggestedDescription: analysis.suggestedDescription,
        recommendedAction: analysis.recommendedAction,
        limitations: analysis.limitations,
      },
      requiresHumanReview: true,
      message:
        'AI suggestions only. Confirm the details before submitting your report.',
    });
  } catch (error) {
    console.error('Gemini issue analysis failed:', error);

    res.status(502).json({
      error:
        'Gemini analysis failed. Check your API key, model access, quota, and network connection.',
    });
  }
});

// Health check.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RoadWatch API',
  });
});

// Register public accounts as citizens only.
app.post('/api/auth/register', async (req, res) => {
  if (!usersCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const { name, email, password, ward, phone } = req.body ?? {};

    if (
      !validText(name, 100) ||
      !validText(email, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 72 ||
      (ward !== undefined && !validText(ward, 100)) ||
      (phone !== undefined &&
        (typeof phone !== 'string' || phone.length > 30))
    ) {
      res.status(400).json({
        error: 'Enter a valid name, email, password (8–72 characters), and optional contact details.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        error: 'An account with this email already exists.',
      });
      return;
    }

    const user: UserDocument = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'citizen',
      ward: typeof ward === 'string' ? ward.trim() : undefined,
      phone: typeof phone === 'string' ? phone.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    await usersCollection.insertOne(user);

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = user.id;

    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        error: 'An account with this email already exists.',
      });
      return;
    }

    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Could not create your account.' });
  }
});

// Sign in using the stored password hash.
app.post('/api/auth/login', async (req, res) => {
  if (!usersCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      email.length > 254 ||
      password.length > 72
    ) {
      res.status(400).json({ error: 'Enter your email and password.' });
      return;
    }

    const user = await usersCollection.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = user.id;

    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Could not sign in.' });
  }
});

// Return the server-verified identity for the current session.
app.get('/api/auth/me', requireAuth, async (req, res) => {
  if (!usersCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const user = await usersCollection.findOne({
      id: req.session.userId,
    });

    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie(SESSION_COOKIE);
      res.status(401).json({ error: 'Your session is no longer valid.' });
      return;
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error('Session lookup failed:', error);
    res.status(500).json({ error: 'Could not verify your session.' });
  }
});

// Sign out and invalidate the server-side session.
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({ error: 'Could not sign out.' });
      return;
    }

    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      path: '/',
    });

    res.json({ message: 'Signed out successfully.' });
  });
});

// Fetch complaints. Demo complaints should be labelled by the frontend.
app.get('/api/complaints', async (req, res) => {
  if (!complaintsCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const filter: Document = {};

    if (typeof req.query.category === 'string') {
      filter.category = req.query.category;
    }

    if (typeof req.query.status === 'string') {
      filter.status = req.query.status;
    }

    if (typeof req.query.ward === 'string') {
      filter.ward = req.query.ward;
    }

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const search = req.query.search.trim().slice(0, 100);
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.$or = [
        { id: { $regex: escapedSearch, $options: 'i' } },
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { locationName: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const complaints = await complaintsCollection
      .find(filter)
      .sort({ reportedAt: -1 })
      .limit(500)
      .toArray();

    res.json(complaints);
  } catch (error) {
    console.error('Failed to fetch complaints:', error);
    res.status(500).json({ error: 'Could not fetch complaints.' });
  }
});

// Fetch a complaint by its tracking ID.
app.get('/api/complaints/:id', async (req, res) => {
  if (!complaintsCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const complaint = await complaintsCollection.findOne({
      id: req.params.id,
    });

    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found.' });
      return;
    }

    res.json(complaint);
  } catch (error) {
    console.error('Failed to fetch complaint:', error);
    res.status(500).json({ error: 'Could not fetch complaint.' });
  }
});

// Only signed-in citizens can submit new complaints.
app.post('/api/complaints', requireAuth, async (req, res) => {
  if (!complaintsCollection || !usersCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const body = req.body as Partial<Complaint>;

    const user = await usersCollection.findOne({
      id: req.session.userId,
    });

    if (!user) {
      res.status(401).json({ error: 'Please sign in again.' });
      return;
    }

    if (user.role !== 'citizen') {
      res.status(403).json({
        error: 'Only citizen accounts can submit citizen reports.',
      });
      return;
    }

    const requiredTextFields = [
      body.title,
      body.description,
      body.ward,
      body.locationName,
    ];

    if (
      requiredTextFields.some(
        (value) => typeof value !== 'string' || !value.trim(),
      ) ||
      ![
        'Potholes',
        'Streetlights',
        'Drainage',
        'Open Manholes',
        'Water Leaks',
        'Debris & Floods',
      ].includes(body.category ?? '') ||
      !['Low', 'Medium', 'High', 'Critical'].includes(body.severity ?? '') ||
      !body.coordinates ||
      typeof body.coordinates.lat !== 'number' ||
      typeof body.coordinates.lng !== 'number' ||
      !Number.isFinite(body.coordinates.lat) ||
      !Number.isFinite(body.coordinates.lng) ||
      body.coordinates.lat < -90 ||
      body.coordinates.lat > 90 ||
      body.coordinates.lng < -180 ||
      body.coordinates.lng > 180 ||
      !body.evidence ||
      typeof body.evidence !== 'object'
    ) {
      res.status(400).json({
        error: 'Please provide valid complaint details, coordinates, and evidence information.',
      });
      return;
    }

    let id = '';

    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `RW-${new Date().getFullYear()}-${randomInt(1000, 10000)}`;
      const existing = await complaintsCollection.findOne({ id: candidate });

      if (!existing) {
        id = candidate;
        break;
      }
    }

    if (!id) {
      res.status(503).json({
        error: 'Could not generate a tracking ID. Please try again.',
      });
      return;
    }

    const now = new Date().toISOString();

    const newComplaint = {
      id,
      title: body.title!.trim(),
      category: body.category!,
      description: body.description!.trim(),
      severity: body.severity!,
      status: 'Submitted',
      ward: body.ward!.trim(),
      locationName: body.locationName!.trim(),
      coordinates: {
        lat: body.coordinates.lat,
        lng: body.coordinates.lng,
      },
      reportedAt: now,
      updatedAt: now,
      citizenName: user.name,
      citizenPhoneMasked: undefined,
      evidence: body.evidence,
      endorsementsCount: 0,
      commentsCount: 0,
      comments: [],
      isDemoData: false,
      reportedByUserId: user.id,
    };

    await complaintsCollection.insertOne(newComplaint);

    res.status(201).json(newComplaint);
  } catch (error) {
    console.error('Failed to create complaint:', error);
    res.status(500).json({ error: 'Could not save the complaint.' });
  }
});

async function startServer() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing from the root .env file.');
    process.exitCode = 1;
    return;
  }

  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    console.error(
      'SESSION_SECRET is missing or too short. Configure a strong secret in the root .env file.',
    );
    process.exitCode = 1;
    return;
  }

  let client: MongoClient | undefined;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const database = client.db('roadwatch');
    await database.command({ ping: 1 });

    usersCollection = database.collection<UserDocument>('users');
    complaintsCollection = database.collection('complaints');

    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    await complaintsCollection.createIndex({ id: 1 }, { unique: true });

    const store = MongoStore.create({
      client,
      dbName: 'roadwatch',
      collectionName: 'sessions',
      ttl: 14 * 24 * 60 * 60,
      autoRemove: 'native',
    });

    sessionMiddleware = session({
      name: SESSION_COOKIE,
      secret: SESSION_SECRET,
      store,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    });

    console.log('MongoDB connected successfully.');
    console.log('Authentication and session store initialized.');
    console.log(
      GEMINI_API_KEY
        ? 'Gemini API key detected.'
        : 'Warning: GEMINI_API_KEY is missing; AI analysis will be unavailable.',
    );

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`RoadWatch API running on port ${PORT}.`);
    });
  } catch (error) {
    console.error('RoadWatch startup failed.');

    if (error instanceof Error) {
      console.error(`${error.name}: ${error.message}`);
    } else {
      console.error('An unknown error occurred.');
    }

    if (client) {
      await client.close().catch(() => {});
    }

    process.exitCode = 1;
  }
}

startServer();
