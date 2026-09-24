# Sitio web de Épsilon Soluciones

Sitio estático (HTML, CSS y JavaScript, sin dependencias ni compilación).

## Estructura

```
index.html                  Landing principal
estilos.css                 Estilos de todo el sitio
main.js                     Interacciones (animaciones, contadores, servicios, preguntas)
assets/                     Imágenes (logos, fotos del equipo, tablero, logos de clientes)
preguntas/index.html        Índice de los 11 clusters de preguntas
preguntas/<cluster>/        Una página por cluster, con sus preguntas y datos estructurados
robots.txt, sitemap.xml     Para buscadores
```

## Cómo verlo en tu computadora

Abrir `index.html` en el navegador alcanza. Si querés servirlo como en producción:

```
python3 -m http.server 8000
```

y entrar a http://localhost:8000

## Cómo publicarlo

1. Crear un repositorio nuevo en GitHub y subir esta carpeta.
2. Entrar a vercel.com, iniciar sesión con GitHub e importar el repositorio.
3. En framework preset elegir "Other". No hace falta comando de build ni carpeta de salida.
4. Desplegar. Vercel entrega una URL de prueba.
5. En Vercel, ir a Settings, Domains, y agregar `epsilonsoluciones.com.ar`.
6. Vercel muestra los servidores de nombres a cargar en NIC Argentina (nic.ar), en "Delegar".
7. Cargarlos ahí y ejecutar los cambios. La propagación puede tardar hasta unas horas.

Desde ese momento, cada cambio que se sube al repositorio se publica solo.

## Pendientes antes de publicar

- Reemplazar el testimonio y la foto de Martina Ríos, que son de ejemplo.
- Cargar el video de presentación y el testimonio en video de Alejo.
- Revisar los textos de las 200 preguntas entre los socios.
- Decidir si se instala el Pixel de Meta y Google Analytics (y en ese caso sumar la política de privacidad).
