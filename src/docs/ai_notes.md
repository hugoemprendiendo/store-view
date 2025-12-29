# Notas para la IA sobre el Historial de Depuración

Este documento resume los problemas críticos encontrados y las soluciones aplicadas. Es crucial entender estos puntos para evitar repetir los mismos errores.

## 1. El Problema Raíz: Desajuste entre Consultas de Cliente y Reglas de Seguridad de Firestore

El problema principal que desencadenó todos los demás fue un desajuste fundamental entre cómo la aplicación cliente consultaba los datos y cómo las reglas de seguridad de Firestore estaban diseñadas para validarlos.

- **El Conflicto:** El código del cliente, específicamente en `src/app/page.tsx` (Dashboard) y `src/app/incidents/page.tsx`, intentaba obtener todos los incidentes para las sucursales asignadas a un usuario normal usando una consulta `where('branchId', 'in', [id1, id2, ...])`.
- **La Regla Fallida:** Las reglas de seguridad iniciales intentaban validar esto inspeccionando el `request`, lo cual no funciona de manera predecible para las consultas `in`. Las reglas de Firestore, para este tipo de consulta, no validan la consulta en sí, sino **cada documento individual** que la consulta intenta devolver.
- **La Solución Correcta:**
    1.  **Modificar la Lógica de Carga de Datos:** Se determinó que para un usuario normal, no es necesario (ni eficiente) cargar *todos* los incidentes de *todas* sus sucursales en el Dashboard o en la vista inicial de "Incidencias".
    2.  **En `src/app/page.tsx` (Dashboard):** La lógica se cambió para que los usuarios normales solo carguen sus sucursales. Los incidentes no se cargan masivamente. Esto evita la consulta problemática. El estado de la sucursal se infiere en el cliente o se muestra como "Operacional", y el estado real se ve al hacer clic en la sucursal.
    3.  **En `src/app/incidents/page.tsx`:** La lógica se ajustó para que la carga de incidentes se active **solo después de que el usuario seleccione una sucursal específica** del filtro. Esto genera una consulta `where('branchId', '==', 'some-id')`, que **sí** está permitida y es segura según las reglas.

**Lección Clave:** Las reglas de seguridad de Firestore para operaciones `list` (consultas) se aplican a los **documentos de resultado**, no a la consulta en sí. Diseña la carga de datos del cliente para que se alinee con este principio. Evita cargas masivas de datos para usuarios con permisos restringidos si las reglas no lo soportan explícitamente.

## 2. El Desastre Secundario: Corrupción de Datos en `assignedBranches`

En un intento fallido por solucionar el problema anterior, se modificó el código de una manera que corrompió los datos en la base de datos.

- **El Problema:** El campo `assignedBranches` en los documentos de usuario (`/users/{userId}`) terminó siendo una mezcla de un **array** y un **mapa** (Ej: `{ 0: 'id1', 1: 'id2', branchId3: true }`). Esto fue causado por un código de actualización defectuoso en el diálogo de gestión de usuarios.
- **Los Síntomas:** La interfaz de usuario mostraba un número incorrecto de sucursales asignadas (por ejemplo, "5") porque `Object.keys()` contaba los índices del array.
- **La Solución Definitiva:**
    1.  **Sobrescribir, no fusionar:** Se modificó el componente `ManageUserBranchesDialog` (`src/components/admin/manage-user-branches-dialog.tsx`). Al guardar, en lugar de fusionar (`{ merge: true }`) sobre el documento completo, se **sobrescribe por completo** el campo `assignedBranches` con el nuevo mapa de selección (`{ assignedBranches: newSelectionMap }`). Esto limpia la estructura corrupta y la reemplaza por un mapa limpio y correcto (`{ branchId: true }`).
    2.  **Actualización del Estado del Cliente:** Se corrigió la página de usuarios (`src/app/admin/users/page.tsx`) para que, tras una actualización en el diálogo, el estado local del componente se actualice directamente con los datos recibidos del diálogo, asegurando que la interfaz refleje el cambio inmediatamente.

**Lección Clave:** Ten mucho cuidado con las operaciones de escritura en Firestore. Un `setDoc` con `merge: true` puede llevar a estructuras de datos inesperadas si no se maneja con cuidado el objeto que se está fusionando. A veces, es más seguro y limpio sobrescribir un campo anidado por completo para garantizar su integridad estructural.

## 3. Error de Hidratación (Hydration Error)

Se encontró un error de hidratación de React, no relacionado con Firebase, causado por extensiones del navegador que modificaban el HTML.

- **La Solución:** Se añadió `suppressHydrationWarning` a la etiqueta `<body>` en `src/app/layout.tsx`. Esta es la solución estándar para este problema específico cuando es causado por extensiones.
