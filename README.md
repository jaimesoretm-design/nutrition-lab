# Nutrition Lab

MVP de una aplicación de organización nutricional flexible para adultos.

## Modo actual: uso personal

Nutrition Lab está preparada para usarse de forma personal en tu ordenador. Los datos se guardan localmente y no necesitas crear cuentas externas, contratar servicios ni configurar una API.

## Estado actual

- Interfaz responsive.
- Onboarding con perfil, objetivo, alimentación y número de comidas.
- Estimación energética orientativa.
- Recetas y filtros.
- Asistente de demostración.
- Planificación semanal y guardado local/servidor.
- Catálogos iniciales de recetas y alimentos.
- Endpoint de salud para comprobar el servicio.

## Arranque local

Puedes abrir `index.html` directamente para probar la interfaz. Para activar el servidor local y guardar perfiles y planes en la carpeta de datos:

```text
npm start
```

Después, abre `http://localhost:4173`.

## Antes de compartirla

Esta versión aún necesita autenticación segura, base de datos gestionada, HTTPS, protección de sesiones, proveedor de correo, conexión real al modelo de IA, revisión del contenido por un dietista-nutricionista y documentación legal de privacidad.

La estimación energética y las recetas son orientativas. Nutrition Lab no diagnostica ni sustituye atención sanitaria.
