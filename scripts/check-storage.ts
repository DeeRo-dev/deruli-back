/**
 * Chequeo del almacenamiento de imágenes.
 *
 *   pnpm storage:check
 *
 * Hace el viaje completo con un archivo de prueba —subir, leer por URL
 * pública, borrar— y dice en qué paso falla. Existe porque los errores de
 * configuración de Supabase se manifiestan tarde y confusos: un bucket
 * privado sube bien y recién falla al mostrar la imagen, y una key
 * equivocada da un 400 sin explicar cuál de las dos está mal.
 *
 * No imprime la key ni ningún secreto.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const BUCKET = process.env.SUPABASE_BUCKET?.trim() || 'app-images';

/* PNG de 1x1 transparente. Es el archivo válido más chico que existe: no
   hace falta tener una foto a mano para correr el chequeo. */
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const ok = (message: string) => console.log(`  OK      ${message}`);
const fail = (message: string) => console.log(`  FALLA   ${message}`);

async function main(): Promise<number> {
  console.log('\nChequeo de Supabase Storage\n');

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    fail('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
    console.log('\n  Están en el panel de Supabase: Project Settings → API');
    return 1;
  }

  ok(`SUPABASE_URL: ${url}`);
  ok(`Service role key: cargada (${key.length} caracteres)`);
  ok(`Bucket: ${BUCKET}`);

  /* Confundir la key pública con la secreta es el error más fácil: están
     una al lado de la otra en el panel. Se detecta acá para no terminar
     depurando un 400 del storage.

     Supabase tiene dos sistemas conviviendo: el nuevo (`sb_secret_…` /
     `sb_publishable_…`) y el viejo, donde ambas son JWT y el rol viaja en
     el payload. */
  if (key.startsWith('sb_publishable_')) {
    fail(
      'Esa es la publishable key, la pública. Se necesita la de "Secret ' +
        'keys" (sb_secret_…).',
    );
    return 1;
  }

  if (key.startsWith('sb_secret_')) {
    ok('La key es una secret key');
  } else {
    try {
      const payload = JSON.parse(
        Buffer.from(key.split('.')[1], 'base64').toString(),
      ) as { role?: string };

      if (payload.role !== 'service_role') {
        fail(
          `La key es de rol "${payload.role ?? 'desconocido'}", no service_role. ` +
            'Con la anon key las subidas se rechazan por las políticas del bucket.',
        );
        return 1;
      }
      ok('La key es service_role');
    } catch {
      console.log('  aviso   No se pudo leer el rol de la key (¿formato raro?)');
    }
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: buckets, error: listError } =
    await client.storage.listBuckets();

  if (listError) {
    fail(`No se pudo hablar con Storage: ${listError.message}`);
    console.log('\n  Suele ser la URL mal escrita o la key de otro proyecto.');
    return 1;
  }

  const bucket = buckets.find((item) => item.name === BUCKET);

  if (!bucket) {
    fail(`No existe el bucket "${BUCKET}"`);
    console.log(
      `  Crealo en Storage → New bucket, con el nombre exacto "${BUCKET}" y público.`,
    );
    console.log(
      `  Buckets que sí existen: ${buckets.map((b) => b.name).join(', ') || '(ninguno)'}`,
    );
    return 1;
  }
  ok(`El bucket "${BUCKET}" existe`);

  if (!bucket.public) {
    fail(
      `El bucket "${BUCKET}" es privado: las subidas van a andar, pero las ` +
        'imágenes se van a ver rotas.',
    );
    console.log('  Storage → el bucket → Settings → Public bucket: ON');
    return 1;
  }
  ok('El bucket es público');

  // Viaje completo con un archivo descartable.
  const path = `_check/${randomUUID()}.png`;

  const { error: uploadError } = await client.storage
    .from(BUCKET)
    .upload(path, PIXEL, { contentType: 'image/png' });

  if (uploadError) {
    fail(`No se pudo subir: ${uploadError.message}`);
    return 1;
  }
  ok('Subida');

  const {
    data: { publicUrl },
  } = client.storage.from(BUCKET).getPublicUrl(path);

  const response = await fetch(publicUrl);

  if (!response.ok) {
    fail(`La URL pública devuelve ${response.status}: ${publicUrl}`);
    await client.storage.from(BUCKET).remove([path]);
    return 1;
  }
  ok(`La URL pública responde ${response.status}`);

  const { error: removeError } = await client.storage
    .from(BUCKET)
    .remove([path]);

  if (removeError) {
    fail(`No se pudo borrar el archivo de prueba: ${removeError.message}`);
    console.log(`  Quedó colgado en ${path}, borralo a mano.`);
    return 1;
  }
  ok('Borrado');

  console.log('\nTodo listo: las imágenes de la app van a funcionar.\n');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    fail(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
