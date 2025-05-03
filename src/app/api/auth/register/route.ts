import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { executeRun, executeFirst } from '@/lib/db';

// Define the expected request body structure
interface RegisterRequestBody {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  role_name: string; // Expect role name (e.g., 'Admin', 'SalesRep')
}

// Define the structure of the Role object from the database
interface Role {
  role_id: number;
  role_name: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RegisterRequestBody;
    const { username, password, full_name, email, phone_number, role_name } = body;

    // Basic validation
    if (!username || !password || !full_name || !role_name) {
      return NextResponse.json({ message: 'Missing required fields (username, password, full_name, role_name)' }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await executeFirst('SELECT user_id FROM Users WHERE username = ?', [username]);
    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    // Find the role_id based on role_name
    const role = await executeFirst<Role>('SELECT role_id FROM Roles WHERE role_name = ?', [role_name]);
    if (!role) {
      return NextResponse.json({ message: 'Invalid role name provided' }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const result = await executeRun(
      'INSERT INTO Users (username, password_hash, full_name, email, phone_number, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password_hash, full_name, email || null, phone_number || null, role.role_id]
    );

    if (result.success) {
      return NextResponse.json({ message: 'User registered successfully', userId: result.meta.last_row_id }, { status: 201 });
    } else {
      console.error('Failed to insert user:', result);
      return NextResponse.json({ message: 'Failed to register user' }, { status: 500 });
    }

  } catch (error) {
    console.error('Registration error:', error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

