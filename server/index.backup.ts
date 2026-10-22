
import 'dotenv/config';
import { setServers } from 'node:dns';
import { randomInt } from 'node:crypto';
import express from 'express';
import { MongoClient, Collection, Document } from 'mongodb';
import type { Complaint } from '../src/types';


// Temporary workaround for the Node.js DNS issue on this computer.
setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json({ limit: '1mb' }));

// Allow requests from the local RoadWatch frontend.
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
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

// Health-check endpoint.
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RoadWatch API',
  });
});

let complaintsCollection: Collection<Document> | undefined;

// Fetch complaints stored in MongoDB.
// Synthetic demo complaints remain separate from live reports.
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

// Fetch one complaint by its public tracking ID.
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

// Create a new citizen complaint.
app.post('/api/complaints', async (req, res) => {
  if (!complaintsCollection) {
    res.status(503).json({ error: 'Database is not ready.' });
    return;
  }

  try {
    const body = req.body as Partial<Complaint>;

    const requiredTextFields = [
      body.title,
      body.description,
      body.ward,
      body.locationName,
      body.citizenName,
    ];

    if (
      requiredTextFields.some(
        (value) => typeof value !== 'string' || !value.trim(),
      ) ||
      !['Potholes', 'Streetlights', 'Drainage', 'Open Manholes',
        'Water Leaks', 'Debris & Floods'].includes(body.category ?? '') ||
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

    // Generate a unique tracking ID.
    let id = '';

    for (let attempt = 0; attempt < 10; attempt++) {
      id = `RW-${new Date().getFullYear()}-${randomInt(1000, 10000)}`;

      const existing = await complaintsCollection.findOne({ id });

      if (!existing) {
        break;
      }

      id = '';
    }

    if (!id) {
      res.status(503).json({
        error: 'Could not generate a tracking ID. Please try again.',
      });
      return;
    }

    const now = new Date().toISOString();

    // Only accept fields intended for initial citizen submission.
    // Status, assignments, feedback, and verification results are
    // controlled separately and cannot be set by this endpoint.
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
      citizenName: body.citizenName!.trim(),
      citizenPhoneMasked:
        typeof body.citizenPhoneMasked === 'string'
          ? body.citizenPhoneMasked
          : undefined,
      evidence: body.evidence,
      endorsementsCount: 0,
      commentsCount: 0,
      comments: [],
      isDemoData: false,
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

  let client: MongoClient | undefined;

  try {
    client = new MongoClient(MONGODB_URI);

    await client.connect();

    const database = client.db('roadwatch');
    await database.command({ ping: 1 });

    complaintsCollection = database.collection('complaints');

    // Ensure complaint tracking IDs are unique.
    await complaintsCollection.createIndex({ id: 1 }, { unique: true });

    console.log('MongoDB connected successfully.');

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
