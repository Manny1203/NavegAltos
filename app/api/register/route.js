import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'El correo y la contraseña son obligatorios' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Este correo ya está registrado' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(
      { message: 'Usuario creado exitosamente', user: userWithoutPassword },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error en el registro:', error);
    return NextResponse.json(
      { message: 'Hubo un error al registrar el usuario' },
      { status: 500 }
    );
  }
}