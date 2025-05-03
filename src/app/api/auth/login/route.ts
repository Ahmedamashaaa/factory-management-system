import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeFirst } from '@/lib/db';

// Define the expected request body structure
interface LoginRequestBody {
  username: string;
  password: string;
}

// Define the structure of the User object from the database
interface User {
  user_id: number;
  username: string;
  password_hash: string;
  role_id: number;
  is_active: number; // SQLite uses 1 for TRUE
}

// Define the structure of the Role object from the database
interface Role {
  role_id: number;
  role_name: string;
}

// Ensure JWT_SECRET is set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key'; // Replace with a strong secret, preferably from env vars

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as LoginRequestBody;
    const { username, password } = body;

    // Basic validation
    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required' }, { status: 400 });
    }

    // Find the user by username
    const user = await executeFirst<User>('SELECT user_id, username, password_hash, role_id, is_active FROM Users WHERE username = ?', [username]);

    if (!user) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 }); // User not found
    }

    // Check if user is active
    if (!user.is_active) {
        return NextResponse.json({ message: 'User account is inactive' }, { status: 403 });
    }

    // Compare the provided password with the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 }); // Incorrect password
    }

    // Fetch role name
    const role = await executeFirst<Role>('SELECT role_name FROM Roles WHERE role_id = ?', [user.role_id]);
    const roleName = role ? role.role_name : 'Unknown';

    // Generate JWT token
    const tokenPayload = {
      userId: user.user_id,
      username: user.username,
      role: roleName
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

    // Return the token
    return NextResponse.json({ message: 'Login successful', token }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    // Check if the error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return NextResponse.json({ message: 'Invalid JSON format in request body' }, { status: 400 });
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}

