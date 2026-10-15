-- Maak jezelf beheerder (studio). Vervang het e-mailadres door het adres
-- waarmee je wilt inloggen, en voer dit één keer uit in de SQL Editor van
-- Supabase, na de migratie.
insert into public.studio_members (email) values (lower('info@miminteriors.com'))
on conflict do nothing;
