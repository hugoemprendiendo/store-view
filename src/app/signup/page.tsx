'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, UserPlus, Store } from 'lucide-react';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';

const signupSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof signupSchema>) => {
    setIsSubmitting(true);
    try {
      // Check if any user exists to determine the role
      const usersCollection = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const isFirstUser = usersSnapshot.empty;
      const role = isFirstUser ? 'superadmin' : 'user';

      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Create a user profile document in Firestore with the determined role
      const userProfileRef = doc(firestore, 'users', user.uid);
      await setDoc(userProfileRef, {
        name: values.name,
        email: values.email,
        createdAt: new Date().toISOString(),
        role: role, // Add the role to the document
      });

      toast({
        title: 'Registro Exitoso',
        description: `Tu cuenta ha sido creada con el rol de ${role}.`,
      });
      // The AuthProvider will handle redirection
    } catch (error: any) {
      console.error(error);
      let description = 'Ocurrió un error inesperado.';
      if (error.code === 'auth/email-already-in-use') {
          description = 'Este correo electrónico ya está en uso.';
      }
      toast({
        variant: 'destructive',
        title: 'Error en el Registro',
        description,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
       <div className="flex items-center gap-2 mb-4">
        <Store className="size-7 text-accent" />
        <h2 className="text-xl font-bold text-foreground font-headline">
          StoreView
        </h2>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Crear una Cuenta</CardTitle>
          <CardDescription>
            Regístrate para empezar a gestionar tus sucursales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                    <UserPlus className="mr-2"/>
                )}
                Crear Cuenta
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center text-sm">
          <p>
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
