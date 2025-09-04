# borrar todo 
npx prisma db push --force-reset 
# Generar cliente de Prisma
# nota simpre usar cuando tengamos problemas con los typos ts
npx prisma generate

# Ejecutar migraciones (crea las tablas)
npx prisma db push

# Poblar la base de datos con datos iniciales
npx prisma db seed

# 1. Verificar conexión a la base de datos
npx prisma db pull