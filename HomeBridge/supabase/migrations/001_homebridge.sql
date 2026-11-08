-- Run once in the Supabase SQL editor. All timestamps are timestamptz (UTC instants).
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check (length(full_name) between 1 and 100),
 email text not null, role text not null check(role in ('student','landlord')),
 preferred_timezone text not null default 'America/Toronto', created_at timestamptz not null default now()
);
create table public.properties (
 id uuid primary key default gen_random_uuid(), landlord_id uuid not null references public.profiles(id),
 title text not null check(length(title) between 5 and 120), description text not null check(length(description) between 20 and 5000),
 city text not null, province text not null default 'Ontario', university text not null default '', address text not null,
 monthly_rent integer not null check(monthly_rent between 1 and 50000),
 room_type text not null check(room_type in ('Private room','Shared room','Studio','Entire apartment')),
 bedrooms integer not null check(bedrooms between 0 and 20), bathrooms numeric(3,1) not null check(bathrooms between 0.5 and 20),
 amenities text[] not null default '{}', available_from date not null,
 status text not null default 'active' check(status in ('active','unavailable')),
 is_demo boolean not null default false, created_at timestamptz not null default now()
);
create table public.property_images (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id) on delete cascade,
 image_url text not null check(image_url ~ '^https://'), storage_path text, created_at timestamptz not null default now()
);
create table public.viewing_slots (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id),
 landlord_id uuid not null references public.profiles(id), start_time timestamptz not null, end_time timestamptz not null,
 viewing_type text not null check(viewing_type in ('virtual','in-person')),
 meeting_url text check(meeting_url is null or meeting_url ~ '^https://'),
 removed boolean not null default false,
 check(end_time > start_time and end_time <= start_time + interval '4 hours'),
 unique(property_id,start_time,viewing_type)
);
create table public.bookings (
 id uuid primary key default gen_random_uuid(), property_id uuid not null references public.properties(id),
 student_id uuid not null references public.profiles(id), slot_id uuid not null references public.viewing_slots(id),
 status text not null default 'confirmed' check(status in ('confirmed','cancelled','completed')),
 created_at timestamptz not null default now()
);
-- The final backstop even if two requests arrive at exactly the same instant.
create unique index one_reservation_per_slot on public.bookings(slot_id) where status <> 'cancelled';
create table public.saved_properties (
 id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
 property_id uuid not null references public.properties(id) on delete cascade, unique(student_id,property_id)
);
create index properties_search on public.properties(status,city,monthly_rent);
create index properties_owner on public.properties(landlord_id);
create index images_property on public.property_images(property_id);
create index slots_property_time on public.viewing_slots(property_id,start_time);
create index bookings_student on public.bookings(student_id);
create index bookings_property on public.bookings(property_id);

create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,email,role) values(new.id,
 left(coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'HomeBridge member'),100), coalesce(new.email,''),
 case when new.raw_user_meta_data->>'role' = 'landlord' then 'landlord' else 'student' end);
 return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
-- Role is set at registration; subsequent editable Auth metadata cannot elevate it.
create function public.my_role() returns text language sql stable security definer set search_path = '' as $$
 select role from public.profiles where id = auth.uid(); $$;

create function public.owns_property(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.properties where id=p_id and landlord_id=auth.uid()); $$;
create function public.has_booking(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.bookings where property_id=p_id and student_id=auth.uid()); $$;
revoke execute on function public.owns_property(uuid),public.has_booking(uuid) from public;
grant execute on function public.owns_property(uuid),public.has_booking(uuid) to anon,authenticated;
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.viewing_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.saved_properties enable row level security;
revoke all on public.profiles, public.properties, public.property_images, public.viewing_slots, public.bookings, public.saved_properties from anon, authenticated;
grant select on public.properties, public.property_images to anon, authenticated;
grant select on public.profiles,public.viewing_slots,public.bookings,public.saved_properties to authenticated;
grant update(full_name,preferred_timezone) on public.profiles to authenticated;
grant insert,update on public.properties to authenticated;
grant insert,delete on public.property_images,public.saved_properties to authenticated;
create policy profile_self_read on public.profiles for select to authenticated using(id=auth.uid());
create policy profile_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy property_read on public.properties for select using(status='active' or landlord_id=auth.uid() or public.has_booking(id));
create policy property_create on public.properties for insert to authenticated with check(landlord_id=auth.uid() and public.my_role()='landlord');
create policy property_update on public.properties for update to authenticated using(landlord_id=auth.uid() and public.my_role()='landlord') with check(landlord_id=auth.uid() and public.my_role()='landlord');
create policy image_read on public.property_images for select using(exists(select 1 from public.properties p where p.id=property_id));
create policy image_create on public.property_images for insert to authenticated with check(public.owns_property(property_id));
create policy image_delete on public.property_images for delete to authenticated using(public.owns_property(property_id));
-- Meeting URLs are private: only owners and participants with active bookings may read slots.
create policy slots_private on public.viewing_slots for select to authenticated using(landlord_id=auth.uid() or exists(select 1 from public.bookings b where b.slot_id=viewing_slots.id and b.student_id=auth.uid() and b.status<>'cancelled'));
create policy bookings_participant on public.bookings for select to authenticated using(student_id=auth.uid() or public.owns_property(property_id));
create policy saved_self on public.saved_properties for all to authenticated using(student_id=auth.uid()) with check(student_id=auth.uid() and public.my_role()='student');

-- Only this safe projection is public. Never expose meeting_url in available slots.
create function public.available_slots(p_property uuid) returns table(id uuid,start_time timestamptz,end_time timestamptz,viewing_type text)
language sql stable security definer set search_path = '' as $$
 select s.id,s.start_time,s.end_time,s.viewing_type from public.viewing_slots s
 join public.properties p on p.id=s.property_id
 where p.id=p_property and p.status='active' and not s.removed and s.start_time>now()
 and not exists(select 1 from public.bookings b where b.slot_id=s.id and b.status<>'cancelled') order by s.start_time; $$;

create function public.book_viewing(p_slot uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare s public.viewing_slots; p public.properties; result uuid;
begin
 if auth.uid() is null or public.my_role()<>'student' then raise exception 'Student account required' using errcode='42501'; end if;
 -- Lock property before slot: all mutating functions use the same lock order.
 select p0.* into p from public.properties p0 join public.viewing_slots s0 on s0.property_id=p0.id where s0.id=p_slot for update of p0;
 select * into s from public.viewing_slots where id=p_slot for update;
 if s.id is null or s.removed or s.start_time<=now() or p.status<>'active' then raise exception 'Viewing is unavailable' using errcode='P0001'; end if;
 if p.landlord_id=auth.uid() then raise exception 'Cannot book your own property' using errcode='42501'; end if;
 insert into public.bookings(property_id,student_id,slot_id) values(s.property_id,auth.uid(),s.id) returning id into result;
 return result;
exception when unique_violation then raise exception 'This slot has already been booked' using errcode='23505';
end; $$;
create function public.cancel_booking(p_booking uuid) returns void language plpgsql security definer set search_path = '' as $$
declare b public.bookings; s public.viewing_slots;
begin
 select * into b from public.bookings where id=p_booking for update;
 if b.id is null or not (b.student_id=auth.uid() or exists(select 1 from public.properties p where p.id=b.property_id and p.landlord_id=auth.uid())) or auth.uid() is null then raise exception 'Not permitted' using errcode='42501'; end if;
 select * into s from public.viewing_slots where id=b.slot_id;
 if b.status<>'confirmed' or s.start_time<=now() then raise exception 'Only upcoming confirmed bookings may be cancelled'; end if;
 update public.bookings set status='cancelled' where id=b.id;
end; $$;
create function public.complete_booking(p_booking uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 update public.bookings b set status='completed' where b.id=p_booking and b.status='confirmed'
 and exists(select 1 from public.properties p where p.id=b.property_id and p.landlord_id=auth.uid())
 and exists(select 1 from public.viewing_slots s where s.id=b.slot_id and s.end_time<=now());
 if not found then raise exception 'Only the landlord can complete an ended viewing' using errcode='42501'; end if;
end; $$;
create function public.manage_slot(p_property uuid,p_start timestamptz,p_end timestamptz,p_type text,p_url text default null,p_slot uuid default null) returns uuid language plpgsql security definer set search_path = '' as $$
declare result uuid;
begin
 perform 1 from public.properties where id=p_property and landlord_id=auth.uid() and public.my_role()='landlord' for update;
 if not found then raise exception 'Not permitted' using errcode='42501'; end if;
 if p_start<=now() then raise exception 'Choose a future start time'; end if;
 if p_slot is not null then
 perform 1 from public.viewing_slots where id=p_slot and property_id=p_property and not removed and start_time>now() for update;
 if not found or exists(select 1 from public.bookings where slot_id=p_slot and status<>'cancelled') then raise exception 'Cannot edit a reserved or past slot'; end if;
 update public.viewing_slots set start_time=p_start,end_time=p_end,viewing_type=p_type,meeting_url=p_url where id=p_slot returning id into result;
 else
 insert into public.viewing_slots(property_id,landlord_id,start_time,end_time,viewing_type,meeting_url) values(p_property,auth.uid(),p_start,p_end,p_type,p_url) returning id into result;
 end if;
 return result;
end; $$;
create function public.remove_slot(p_slot uuid) returns void language plpgsql security definer set search_path = '' as $$
begin
 perform 1 from public.properties p join public.viewing_slots s on s.property_id=p.id where s.id=p_slot and p.landlord_id=auth.uid() for update of p;
 if not found then raise exception 'Not permitted' using errcode='42501'; end if;
 perform 1 from public.viewing_slots where id=p_slot for update;
 if exists(select 1 from public.bookings where slot_id=p_slot and status<>'cancelled') then raise exception 'Cancel the upcoming appointment first; completed appointments are preserved'; end if;
 update public.viewing_slots set removed=true where id=p_slot;
end; $$;
create function public.my_appointments() returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'status',b.status,'property_id',p.id,'title',p.title,'address',p.address,
 'start_time',s.start_time,'end_time',s.end_time,'viewing_type',s.viewing_type,
 'meeting_url',case when b.status<>'cancelled' then s.meeting_url else null end,
 'student_name',pr.full_name,'student_email',pr.email) order by s.start_time),'[]'::jsonb)
 from public.bookings b join public.properties p on p.id=b.property_id join public.viewing_slots s on s.id=b.slot_id join public.profiles pr on pr.id=b.student_id
 where b.student_id=auth.uid() or p.landlord_id=auth.uid(); $$;
-- Revoke PostgreSQL's default public EXECUTE on all application functions.
revoke execute on function public.create_profile(),public.my_role(),public.available_slots(uuid),public.book_viewing(uuid),public.cancel_booking(uuid),public.complete_booking(uuid),public.manage_slot(uuid,timestamptz,timestamptz,text,text,uuid),public.remove_slot(uuid),public.my_appointments() from public;
grant execute on function public.available_slots(uuid) to anon,authenticated;
grant execute on function public.my_role(),public.book_viewing(uuid),public.cancel_booking(uuid),public.complete_booking(uuid),public.manage_slot(uuid,timestamptz,timestamptz,text,text,uuid),public.remove_slot(uuid),public.my_appointments() to authenticated;

-- Public listing images only; no identity documents. Max 5 MB, raster images.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('property-images','property-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy property_image_upload on storage.objects for insert to authenticated with check(bucket_id='property-images' and public.my_role()='landlord' and (storage.foldername(name))[1]=auth.uid()::text);
create policy property_image_remove on storage.objects for delete to authenticated using(bucket_id='property-images' and (storage.foldername(name))[1]=auth.uid()::text);
