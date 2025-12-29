'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, FilePlus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TestDoc {
    message: string;
    createdAt: any;
}

export default function TestPage() {
    const firestore = useFirestore();
    const [isWriting, setIsWriting] = useState(false);

    // Memoize the query to prevent re-renders
    const testQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'test_docs'), orderBy('createdAt', 'desc'), limit(20));
    }, [firestore]);

    const { data: testDocs, isLoading, error } = useCollection<TestDoc>(testQuery);

    const handleWriteTestDoc = async () => {
        if (!firestore) return;

        setIsWriting(true);
        try {
            const testCollection = collection(firestore, 'test_docs');
            await addDoc(testCollection, {
                message: `Hello from the test page!`,
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Failed to write test document:", e);
        } finally {
            setIsWriting(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Header title="Página de Prueba de Permisos" />
            <Card>
                <CardHeader>
                    <CardTitle>Prueba de Conexión a Firestore</CardTitle>
                    <CardDescription>
                        Esta página intenta leer y escribir en la colección `test_docs`, que tiene permisos completamente públicos (`allow read, write: if true;`).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={handleWriteTestDoc} disabled={isWriting || !firestore}>
                        {isWriting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FilePlus className="mr-2 h-4 w-4" />
                        )}
                        Escribir Documento de Prueba
                    </Button>

                    <div className="p-4 border rounded-lg h-96">
                        <h3 className="font-semibold mb-2">Resultados de la Lectura en Tiempo Real:</h3>
                        {isLoading && (
                            <div className="flex items-center text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                <span>Cargando documentos de prueba...</span>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center text-destructive">
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                <div>
                                    <p className="font-bold">Error al leer de Firestore:</p>
                                    <p className="text-xs break-all">{error.message}</p>
                                </div>
                            </div>
                        )}
                        {!isLoading && !error && (
                            <div className="flex items-center text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>Conexión de lectura exitosa. {testDocs ? testDocs.length : 0} documentos cargados.</span>
                            </div>
                        )}
                        <ScrollArea className="h-72 mt-4">
                            <div className="space-y-2">
                                {testDocs?.map(doc => (
                                    <div key={doc.id} className="text-sm p-2 bg-muted rounded-md">
                                        <p><strong>ID:</strong> {doc.id}</p>
                                        <p><strong>Mensaje:</strong> {doc.message}</p>
                                        <p><strong>Fecha:</strong> {doc.createdAt ? new Date(doc.createdAt.seconds * 1000).toLocaleString() : 'Pendiente'}</p>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
