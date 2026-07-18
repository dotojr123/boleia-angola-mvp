--
-- PostgreSQL database dump
--

\restrict n7BgzaThco7aAyfUXfHqo78oQCZIuLuaTukQfRJIeEWa0NghsEtXQfb3pCplwiK

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: booking_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.booking_status AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'cancelled'
);


ALTER TYPE public.booking_status OWNER TO postgres;

--
-- Name: experience_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.experience_level AS ENUM (
    'novice',
    'intermediate',
    'expert',
    'ambassador'
);


ALTER TYPE public.experience_level OWNER TO postgres;

--
-- Name: ride_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ride_status AS ENUM (
    'scheduled',
    'active',
    'completed',
    'cancelled'
);


ALTER TYPE public.ride_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'passenger',
    'driver',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'none'
);


ALTER TYPE public.verification_status OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_credentials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_credentials (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.auth_credentials OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ride_id uuid,
    passenger_id uuid,
    seats_booked integer DEFAULT 1,
    total_price numeric(10,2),
    status public.booking_status DEFAULT 'pending'::public.booking_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    booking_code character varying(10),
    file_number character varying(20),
    unit_price numeric(10,2),
    commission numeric(10,2),
    currency character varying(3),
    passenger_refund numeric(10,2) DEFAULT 0,
    driver_compensation numeric(10,2) DEFAULT 0,
    expire_date timestamp with time zone,
    trip_is_passed boolean DEFAULT false,
    message_contact_allowed boolean DEFAULT true,
    phone_contact_allowed boolean DEFAULT false
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid,
    receiver_id uuid,
    ride_id uuid,
    content text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    booking_id uuid,
    read_at timestamp with time zone
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type text,
    link text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    bio text,
    license_number text,
    verification_status public.verification_status DEFAULT 'none'::public.verification_status,
    rating numeric(10,2) DEFAULT 5.0,
    reviews_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    experience_level public.experience_level DEFAULT 'novice'::public.experience_level,
    interests text[],
    travel_preferences jsonb DEFAULT '{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}'::jsonb,
    role public.user_role DEFAULT 'passenger'::public.user_role,
    avg_rating numeric(10,2) DEFAULT 5.0,
    total_reviews integer DEFAULT 0,
    first_name character varying(100),
    last_name character varying(100),
    display_name character varying(100),
    gender character varying(20),
    birthdate date,
    phone_verified boolean DEFAULT false,
    email_verified boolean DEFAULT false,
    rides_offered integer DEFAULT 0,
    rides_taken integer DEFAULT 0,
    response_rate integer DEFAULT 0
);


ALTER TABLE public.profiles OWNER TO postgres;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    booking_id uuid,
    reviewer_id uuid,
    reviewee_id uuid,
    rating integer,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    role character varying(20),
    trip_id uuid,
    moderation_status character varying(20) DEFAULT 'ACTIVE'::character varying
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- Name: rides; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rides (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id uuid,
    vehicle_id uuid,
    origin text,
    destination text,
    stops text[],
    departure_time timestamp with time zone,
    estimated_duration interval,
    price_per_seat numeric(10,2),
    currency text DEFAULT 'Kz'::text,
    total_seats integer,
    available_seats integer,
    status public.ride_status DEFAULT 'scheduled'::public.ride_status,
    description text,
    preferences jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    baggage_policy character varying(20),
    permanent_id character varying(100),
    frequency character varying(20),
    price_with_commission numeric(10,2),
    distance_km integer,
    luggage_size character varying(20),
    detour_allowed character varying(20),
    schedule_flexibility character varying(50),
    booking_mode character varying(20),
    view_count integer DEFAULT 0,
    is_comfort boolean DEFAULT false,
    cross_border_alert boolean DEFAULT false,
    instant_booking boolean DEFAULT false
);


ALTER TABLE public.rides OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    key text,
    value jsonb,
    description text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    owner_id uuid,
    make text,
    model text,
    year integer,
    color text,
    plate text,
    seats_capacity integer DEFAULT 4,
    photo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    category character varying(20),
    comfort_level character varying(20),
    comfort_stars integer,
    pictures jsonb DEFAULT '[]'::jsonb,
    is_verified boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.vehicles OWNER TO postgres;

--
-- Name: waypoints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.waypoints (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ride_id uuid,
    order_index integer,
    type text[],
    city character varying(100),
    address text,
    country_code character varying(2) DEFAULT 'AO'::character varying,
    arrival_datetime timestamp with time zone,
    departure_datetime timestamp with time zone,
    price_to_next numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.waypoints OWNER TO postgres;

--
-- Data for Name: auth_credentials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_credentials (id, user_id, email, password_hash, created_at) FROM stdin;
26688ce4-52c4-4da2-919e-dae149835b0d	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	motorista@demo.com	$2a$06$x/DqPqrEEAhflvIEnaxgQ.TV1Bvh4ZfyaIHfkqO7mvKYjViTR48VS	2026-02-04 20:56:00.512276+00
46314ec1-abca-4bc2-a18d-c8cdc7910363	d3f312ef-045e-4412-8fa2-5c01485c7307	admin@demo.com	$2a$06$x/DqPqrEEAhflvIEnaxgQ.TV1Bvh4ZfyaIHfkqO7mvKYjViTR48VS	2026-02-04 20:56:00.512276+00
e1f6ed72-e39e-4903-adbc-c7da49943d10	64600275-8aa4-437a-9337-6bb2e0949e19	artnaweb2022@gmail.com	$2a$06$M1KUrdZRlqDZossU1Vfhe.mjDKeqjgzwU5wpNuBRHOb6gEuRusDM2	2026-02-04 20:56:06.05349+00
1cbe05af-b604-4238-96bb-4410367b9f5e	b6a16ded-0413-42e8-b3c9-ccabe1c1cc33	passageiro1@gmail.com	$2a$10$yh0vH9zbANRwGu/w83KvCOLEy6Zw8nz.plYRLNEFlCsAT0MJiFOVK	2026-02-04 21:05:21.01871+00
8a14d4f0-9c77-4b87-9018-992a1405083d	3036dea7-f519-482f-b0fc-27fb130b428e	Clementinoquessongo@gmail.com	$2a$10$IQO6Cyg.yNFo4TSjBUohGOF5gaVNOUZVqtOq8FQcAWGLewOt7l0nC	2026-02-04 22:32:20.982241+00
3eeeffe2-056f-4fb8-98d3-c795f5e1400a	d93490fd-9025-48af-8d96-d2f61b6f04d4	Clementinoquesson@gmail.com	$2a$10$DtBg0RiQaih21qa3Azp9V.Fniw4Hrw3LPsFDu5dvA.CuMmBV8bQem	2026-02-04 22:42:11.947989+00
3f4a5052-6c96-4264-a8e7-edfe0155eec2	2642426c-d721-4f5a-8542-50be5f9614a9	martajesuina00@gmail.com	$2a$10$VRqhqspqIrYGAbjC.jnrn.AeH0ozCW8CsCRd8Igj2dguchGM.uCLi	2026-02-04 22:46:55.169444+00
0bf460ae-6e34-4b49-89d3-65a1c93f5a04	d1c7810e-7f24-407d-a7ee-02e2383a28b1	osoriopedro000@gmail.com	$2a$10$s6BONsgHweEP2mRna4IosuuudXhePzls0npszeERa0JMvwWlTiLTi	2026-02-04 22:52:20.647966+00
5d12bdf9-262a-4af6-89e8-4c70992fbd45	111bfc05-083e-425d-8d2c-4680f9f91d50	hfbjfhbf@gmail.com	$2a$10$bIUaa.VXOjZvcbN2nNqwC.IkTb1eKwYdi/VGfQksSyOdTODEPg8Da	2026-02-04 22:52:37.020302+00
8de8d491-8b79-46e0-8df6-6c7dcb1232f0	fdde5369-6487-440a-9a83-743d1e294c13	cristianotchitumba30@gmail.com	$2a$10$KAhT28bkYs3E4R03fHD61ew1TUfYQkd5t7fR5al9XibgAca0r/ySa	2026-02-05 20:33:23.023547+00
0e7adad6-60e3-4813-9371-847ab3cdf8e8	03c4c06e-493d-4961-a262-783c91e22585	motorista02@demo.com	$2a$10$VMhjGOjAYCdLiXIoFSfNvextUIDyWxiqKF7DG4JqGVKeRXHRWdaFu	2026-02-05 20:43:06.910102+00
f20ece02-0c1e-42ae-ac8d-1f979a2c1951	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	passageiro02@demo.com	$2a$10$sDvj2L1LhsmmYt/scvkpcOCmvkmDrzbG9t1PlUpATtxaIwwCQdiEy	2026-02-05 20:50:47.996686+00
20250410-5f1b-4cc8-b9be-c135fcc9a599	f4fb2218-3129-4a99-98d9-46d20ef5f043	woda741@gmail.com	$2a$10$/cKr4ZKspxXK5pnlaIZuju3usj6MSO85TIpoUAnaLvzEBbj7dl8p6	2026-02-05 20:53:47.546428+00
4d0f34f3-79e5-4c64-8604-4dbbc44b2acf	a82adb94-6a3f-461a-bf19-84fe6855b473	motorista03@demo.com	$2a$10$bd/5.XDTreLYvmx/aeT4AO75vK5T.XQwZWJi1ChgA820KezWeXGra	2026-02-06 10:13:24.213486+00
0718b19e-0853-40ed-89c2-19ea75a2efc1	b2368d8c-20f5-497f-aefc-e378263f1b89	osorio321@gmail.com	$2a$10$5DK9XhkEiMv9hXYc7uXcGueCKsNTug3vByj7ALCtGf8ZjuwxUO62K	2026-02-06 20:16:52.752112+00
a2536d6b-e187-4ed7-86ff-d0d0ae627762	f3e36cd1-b394-4097-8dad-0c13856496f1	osorio@gmail.com	$2a$10$a0z17lDRxwzZuvHc2mQpjOGOz9uKTUIv9EJpznwUrSd9GiX6qQppG	2026-02-08 15:59:17.389277+00
d279d668-29ba-4a80-920d-ce8e1e7ca635	63d5a899-7506-4d78-a5e6-3aded1d23053	osorio111@gmail.com	$2a$10$HZPGtEndUuowb/JLhOfTHOtp92vxuPE244MuKau/vgmn0P/PcVA6W	2026-02-08 16:01:48.183036+00
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, ride_id, passenger_id, seats_booked, total_price, status, created_at, updated_at, booking_code, file_number, unit_price, commission, currency, passenger_refund, driver_compensation, expire_date, trip_is_passed, message_contact_allowed, phone_contact_allowed) FROM stdin;
b3017a42-7c98-444a-995f-97217db83e5a	9a7298c3-d084-4e33-a962-fe33f60966e6	af69cf7a-db7e-4c4c-be0f-06892072c90d	1	5000.00	pending	2026-01-23 05:46:16.892978+00	2026-01-23 05:46:16.892978+00	\N	\N	5000.00	0.00	AOA	0.00	0.00	\N	f	t	f
e70eddd8-e982-4790-b6c3-3b78bda3809f	db8f046f-ebca-4c1f-8159-3aef46617512	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	1	\N	pending	2026-02-05 23:17:35.159321+00	2026-02-05 23:17:35.159321+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
cf5f2eaf-abb6-48b2-a577-e45c80cad1fc	695efb61-eddc-4f3d-8573-32d9e793c571	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	1	\N	pending	2026-02-05 23:23:00.090547+00	2026-02-05 23:23:00.090547+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
e8c1ace8-3743-4183-859a-3ac814b6e375	9a7298c3-d084-4e33-a962-fe33f60966e6	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	1	\N	pending	2026-02-06 00:07:35.654873+00	2026-02-06 00:07:35.654873+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
bfe8f5e7-a5dd-42b4-84c6-91340db58e8b	e02fde5e-02ca-4c25-b361-609bc2fdd2d3	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	1	\N	pending	2026-02-06 00:17:35.150958+00	2026-02-06 00:17:35.150958+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
fbf4a2d4-ee98-43f0-a1a1-a6ea74f13f8e	44b7c3dd-df6a-4c47-80f4-234b01bcb26d	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	1	\N	pending	2026-02-06 00:19:17.476572+00	2026-02-06 00:19:17.476572+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
a80d28c3-8d54-4664-87c8-6d72260745ed	1712f120-170d-4623-8bb1-bad8e20675f0	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 20:24:13.242162+00	2026-02-06 20:24:13.242162+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
6b74d437-65f0-483e-a1a4-6fbb916d176e	bce68715-1527-447d-8d79-302a31d0847d	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 20:40:51.355422+00	2026-02-06 20:40:51.355422+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
baa9bd81-3de1-4a7e-a964-78e8ee9307ba	bce68715-1527-447d-8d79-302a31d0847d	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 20:47:21.012907+00	2026-02-06 20:47:21.012907+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
6587a992-5d69-4830-b135-bed083b1ed63	bce68715-1527-447d-8d79-302a31d0847d	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 20:47:25.214143+00	2026-02-06 20:47:25.214143+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
44ffde01-e2c0-45e5-b7d8-54737fae1b46	d8cdceaa-698e-4753-9cd0-609701746376	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 21:03:44.048971+00	2026-02-06 21:03:44.048971+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
fbae9681-3c2a-4c61-b4d5-94ac18d3719a	d8cdceaa-698e-4753-9cd0-609701746376	3554884b-af53-449e-962b-c5b676602840	1	\N	pending	2026-02-06 21:10:50.977123+00	2026-02-06 21:10:50.977123+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
da85e659-bb0d-4005-97bf-ee34cefbbd46	c71b9dbb-a901-438b-9ec3-4db19640508d	3554884b-af53-449e-962b-c5b676602840	1	\N	rejected	2026-02-06 21:19:29.513164+00	2026-02-06 21:22:48.897726+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
2ad9be4f-7d2c-46e4-9f48-720d2f7a51ca	bce68715-1527-447d-8d79-302a31d0847d	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	confirmed	2026-02-06 20:47:50.657962+00	2026-02-06 21:29:23.403491+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
936fa248-642c-498c-a7e4-92a8b3510a42	694fe1c7-91bf-4f4b-b0fd-41be5edc5041	3554884b-af53-449e-962b-c5b676602840	1	\N	pending	2026-02-06 21:30:16.706429+00	2026-02-06 21:30:16.706429+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
9a247ea2-f4a6-4441-93f5-2cca3e197800	694fe1c7-91bf-4f4b-b0fd-41be5edc5041	982f2cc6-0a2e-4310-b483-32ad636c1f0a	1	\N	pending	2026-02-06 21:31:59.90455+00	2026-02-06 21:31:59.90455+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
165dcdca-70aa-4803-a1b5-cfcca2db7f87	35803811-5c9e-4e66-9a69-e3aaec5ff21e	f3e36cd1-b394-4097-8dad-0c13856496f1	1	\N	pending	2026-02-08 16:14:05.513175+00	2026-02-08 16:14:05.513175+00	\N	\N	\N	\N	\N	0.00	0.00	\N	f	t	f
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, receiver_id, ride_id, content, is_read, created_at, booking_id, read_at) FROM stdin;
dac0cc46-6941-4c8f-843d-f55fc0a3121c	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	111bfc05-083e-425d-8d2c-4680f9f91d50	\N	OI	f	2026-02-05 23:23:09.752526+00	\N	\N
d45f7e86-b78c-43f7-80cf-43d86802e05d	a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	d1c7810e-7f24-407d-a7ee-02e2383a28b1	\N	OI	f	2026-02-06 00:17:48.252094+00	\N	\N
88097d15-470a-4d0c-8eb2-5ffffe1123ae	3554884b-af53-449e-962b-c5b676602840	b2368d8c-20f5-497f-aefc-e378263f1b89	c71b9dbb-a901-438b-9ec3-4db19640508d	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 21:19:29.515953+00	da85e659-bb0d-4005-97bf-ee34cefbbd46	\N
4ae6ff86-8409-4e73-a508-b00b26726e8f	3554884b-af53-449e-962b-c5b676602840	b2368d8c-20f5-497f-aefc-e378263f1b89	694fe1c7-91bf-4f4b-b0fd-41be5edc5041	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 21:30:16.708841+00	936fa248-642c-498c-a7e4-92a8b3510a42	\N
610ba4d9-a39d-4cdf-9d48-7860623ddc23	f3e36cd1-b394-4097-8dad-0c13856496f1	63d5a899-7506-4d78-a5e6-3aded1d23053	35803811-5c9e-4e66-9a69-e3aaec5ff21e	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-08 16:14:05.516159+00	165dcdca-70aa-4803-a1b5-cfcca2db7f87	\N
c8b54677-04b8-40c1-94ea-e36760de83a2	3554884b-af53-449e-962b-c5b676602840	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	d8cdceaa-698e-4753-9cd0-609701746376	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 21:10:50.979463+00	fbae9681-3c2a-4c61-b4d5-94ac18d3719a	\N
e2652f7b-c3c6-4b50-8b55-3d3404861dbd	3554884b-af53-449e-962b-c5b676602840	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	\N	Reservei lugar 	t	2026-02-06 21:11:15.612747+00	\N	\N
6a4229bc-6f2e-47e9-8844-9046681c520c	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	bce68715-1527-447d-8d79-302a31d0847d	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 20:47:50.661414+00	2ad9be4f-7d2c-46e4-9f48-720d2f7a51ca	\N
67dba96d-50bd-4e37-bfdf-61098ca2effc	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	1712f120-170d-4623-8bb1-bad8e20675f0	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 20:24:13.244734+00	a80d28c3-8d54-4664-87c8-6d72260745ed	\N
4ee07b8c-385f-4eee-89d2-8cfbba1c247e	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	\N	Gostaria de saber se está confirmado a viagem	t	2026-02-06 20:24:37.027327+00	\N	\N
34cd099a-f808-478b-80bd-8b10dbe571d9	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	\N	No primeiro de maio	t	2026-02-06 20:25:58.61933+00	\N	\N
e7a430e0-4123-4d60-b3b4-50575f68bcbb	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	bce68715-1527-447d-8d79-302a31d0847d	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 20:40:51.35768+00	6b74d437-65f0-483e-a1a4-6fbb916d176e	\N
baf38dd9-ab47-4cbe-bf9c-746d414f36bd	b2368d8c-20f5-497f-aefc-e378263f1b89	982f2cc6-0a2e-4310-b483-32ad636c1f0a	\N	Eu confirmo, onde podemos nos encontrar?	t	2026-02-06 20:25:37.88789+00	\N	\N
5d8b54ad-c5a6-43f4-abf6-109d2ef7c06f	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	3554884b-af53-449e-962b-c5b676602840	\N	Obrigado amor 	t	2026-02-06 21:11:25.430039+00	\N	\N
1d4c2bb1-7d22-4a47-83fa-7521072325d3	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	982f2cc6-0a2e-4310-b483-32ad636c1f0a	\N	Fechado 	t	2026-02-06 21:04:04.142673+00	\N	\N
e24e7191-ed5d-4ade-b4c3-961ff4596335	3554884b-af53-449e-962b-c5b676602840	b2368d8c-20f5-497f-aefc-e378263f1b89	\N	Reservo 	t	2026-02-06 21:19:46.043232+00	\N	\N
7fb5bc0c-5145-43e6-af2d-4c8c385acc9e	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	bce68715-1527-447d-8d79-302a31d0847d	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 20:47:21.015365+00	baa9bd81-3de1-4a7e-a964-78e8ee9307ba	\N
6600bb18-6eaf-4e02-890f-acaf1a8397b6	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	bce68715-1527-447d-8d79-302a31d0847d	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 20:47:25.215343+00	6587a992-5d69-4830-b135-bed083b1ed63	\N
efd62a7f-5f26-433f-9206-b6189fd510e0	982f2cc6-0a2e-4310-b483-32ad636c1f0a	b2368d8c-20f5-497f-aefc-e378263f1b89	694fe1c7-91bf-4f4b-b0fd-41be5edc5041	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 21:31:59.90686+00	9a247ea2-f4a6-4441-93f5-2cca3e197800	\N
fe89a519-d0a6-4103-94ff-b79954f0251c	982f2cc6-0a2e-4310-b483-32ad636c1f0a	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	d8cdceaa-698e-4753-9cd0-609701746376	Olá! Acabei de solicitar uma reserva na sua carona.	t	2026-02-06 21:03:44.05142+00	44ffde01-e2c0-45e5-b7d8-54737fae1b46	\N
3b07d7da-cf5c-4267-8a0e-5ec1bef536d3	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	3554884b-af53-449e-962b-c5b676602840	\N	Te amo meu amor	t	2026-02-06 21:11:34.574034+00	\N	\N
bde55858-0f63-49ea-96b9-cf56ad6805d5	63d5a899-7506-4d78-a5e6-3aded1d23053	f3e36cd1-b394-4097-8dad-0c13856496f1	\N	AQUECEU	t	2026-02-08 16:14:41.681757+00	\N	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, content, type, link, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profiles (id, email, full_name, avatar_url, phone, bio, license_number, verification_status, rating, reviews_count, created_at, updated_at, experience_level, interests, travel_preferences, role, avg_rating, total_reviews, first_name, last_name, display_name, gender, birthdate, phone_verified, email_verified, rides_offered, rides_taken, response_rate) FROM stdin;
64600275-8aa4-437a-9337-6bb2e0949e19	artnaweb2022@gmail.com	Roberto	https://ui-avatars.com/api/?name=Roberto&background=0D8ABC&color=fff	\N	\N	\N	verified	5.00	0	2025-11-29 02:11:31.479964+00	2025-11-29 02:11:31.479964+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
af69cf7a-db7e-4c4c-be0f-06892072c90d	passageiro@demo.com	Ana Passageira	https://ui-avatars.com/api/?name=Ana+Passageira&background=0D8ABC&color=fff	\N	\N	\N	none	5.00	0	2026-01-23 05:45:57.300552+00	2026-01-23 05:45:57.300552+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
d3f312ef-045e-4412-8fa2-5c01485c7307	admin@demo.com	Admin Sistema	https://ui-avatars.com/api/?name=Admin+Sistema&background=0D8ABC&color=fff	+244 923 456 791	\N	\N	verified	5.00	0	2025-11-29 02:50:40.764249+00	2025-11-29 02:50:40.764249+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	admin	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
3554884b-af53-449e-962b-c5b676602840	diogogaspar123@gmail.com	Diogo Gaspar 	\N	856865688	\N	\N	none	5.00	0	2026-02-06 21:08:58.785041+00	2026-02-06 21:08:58.785041+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
b2368d8c-20f5-497f-aefc-e378263f1b89	osorio321@gmail.com	Pedro Osorio Motorista	\N	945536973	\N	\N	verified	5.00	0	2026-02-06 20:16:52.752112+00	2026-02-06 20:16:52.752112+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
f3e36cd1-b394-4097-8dad-0c13856496f1	osorio@gmail.com	Adão Cortez	\N	945536973	\N	\N	none	5.00	0	2026-02-08 15:59:17.389277+00	2026-02-08 15:59:17.389277+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
02b006ff-bb39-4e0a-9890-aebe11b2d4e3	motorista@demo.com	Carlos Motorista	/images/driver-manuel.jpg	\N	\N	\N	verified	5.00	0	2026-01-29 01:59:01.530327+00	2026-01-29 01:59:01.530327+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
d1c7810e-7f24-407d-a7ee-02e2383a28b1	osoriopedro000@gmail.com	BOLEIA DO OSORIO	/images/driver-manuel.jpg	937979693	\N	\N	verified	5.00	0	2026-02-04 22:52:20.647966+00	2026-02-04 22:52:20.647966+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
111bfc05-083e-425d-8d2c-4680f9f91d50	hfbjfhbf@gmail.com	clemy quessongo	/images/driver-manuel.jpg	998999899	\N	\N	verified	5.00	0	2026-02-04 22:52:37.020302+00	2026-02-04 22:52:37.020302+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
b6a16ded-0413-42e8-b3c9-ccabe1c1cc33	passageiro1@gmail.com	Passageiro 1	/images/team/member-2.jpg	24999774478	\N	\N	none	5.00	0	2026-02-04 21:05:21.01871+00	2026-02-04 21:05:21.01871+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
3036dea7-f519-482f-b0fc-27fb130b428e	Clementinoquessongo@gmail.com	Clementino Quessongo	/images/team/member-2.jpg	942128826	\N	\N	verified	5.00	0	2026-02-04 22:32:20.982241+00	2026-02-04 22:32:20.982241+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
d93490fd-9025-48af-8d96-d2f61b6f04d4	Clementinoquesson@gmail.com	Clementino Quessongo	/images/team/member-2.jpg	942128826	\N	\N	none	5.00	0	2026-02-04 22:42:11.947989+00	2026-02-04 22:42:11.947989+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
2642426c-d721-4f5a-8542-50be5f9614a9	martajesuina00@gmail.com	Marta Jesuina Damião Gaspar	/images/team/member-2.jpg	937979693	\N	\N	none	5.00	0	2026-02-04 22:46:55.169444+00	2026-02-04 22:46:55.169444+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
fdde5369-6487-440a-9a83-743d1e294c13	cristianotchitumba30@gmail.com	CRISTIANO RAIMUNDO TCHITUMBA	\N	0942678449	\N	\N	none	5.00	0	2026-02-05 20:33:23.023547+00	2026-02-05 20:33:23.023547+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
03c4c06e-493d-4961-a262-783c91e22585	motorista02@demo.com	TESTE	\N	249987894	\N	\N	none	5.00	0	2026-02-05 20:43:06.910102+00	2026-02-05 20:43:06.910102+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
a0ba98f3-86f2-4f97-af66-aa0b6d6f0e2f	passageiro02@demo.com	TESTE02	\N	2499875465	\N	\N	none	5.00	0	2026-02-05 20:50:47.996686+00	2026-02-05 20:50:47.996686+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
f4fb2218-3129-4a99-98d9-46d20ef5f043	woda741@gmail.com	WODA-MARGUEL	\N	945536973	\N	\N	none	5.00	0	2026-02-05 20:53:47.546428+00	2026-02-05 20:53:47.546428+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
a82adb94-6a3f-461a-bf19-84fe6855b473	motorista03@demo.com	Teste	\N	2499852414	\N	\N	none	5.00	0	2026-02-06 10:13:24.213486+00	2026-02-06 10:13:24.213486+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
982f2cc6-0a2e-4310-b483-32ad636c1f0a	osorio123@gmail.com	Osorio Pedro	\N	945536973	\N	\N	none	5.00	0	2026-02-06 20:15:29.252289+00	2026-02-06 20:15:29.252289+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	passenger	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
63d5a899-7506-4d78-a5e6-3aded1d23053	osorio111@gmail.com	Artur Pedro	\N	945536973	\N	\N	none	5.00	0	2026-02-08 16:01:48.183036+00	2026-02-08 16:01:48.183036+00	novice	\N	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	driver	5.00	0	\N	\N	\N	\N	\N	f	f	0	0	0
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at, role, trip_id, moderation_status) FROM stdin;
\.


--
-- Data for Name: rides; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rides (id, driver_id, vehicle_id, origin, destination, stops, departure_time, estimated_duration, price_per_seat, currency, total_seats, available_seats, status, description, preferences, created_at, updated_at, baggage_policy, permanent_id, frequency, price_with_commission, distance_km, luggage_size, detour_allowed, schedule_flexibility, booking_mode, view_count, is_comfort, cross_border_alert, instant_booking) FROM stdin;
80e0513e-f9c3-4d64-9457-3f33de81e7d3	64600275-8aa4-437a-9337-6bb2e0949e19	be617cd5-abd6-4baf-b54f-d4d7c9e44330	Luanda	Benguela	\N	2026-01-30 08:00:00+00	06:00:00	5000.00	AOA	3	3	scheduled	Viagem para Benguela, saída da Mutamba.	{"pets": false, "music": true, "smoking": false, "chattiness": "medium"}	2026-01-29 00:27:54.402443+00	2026-01-29 00:27:54.402443+00	\N	\N	UNIQUE	5882.35	532	MEDIUM	NONE	FIFTEEN_MINUTES	manual	0	f	f	f
df2cde0d-513e-48cc-aec4-b5a2ae14a1ab	111bfc05-083e-425d-8d2c-4680f9f91d50	e1b2cc62-58d1-49e6-8454-54a56c67fca1	Luanda	Benguela	\N	2026-03-27 18:04:00+00	\N	4500.00	Kz	3	3	scheduled		\N	2026-02-04 23:09:53.53258+00	2026-02-04 23:09:53.53258+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
1220f2a1-eba8-4039-bdc0-536af5c0cdcc	d1c7810e-7f24-407d-a7ee-02e2383a28b1	241f20da-780e-4037-ba54-5a6207509569	LUANDA	MUSSULO	\N	2026-02-10 06:00:00+00	\N	7000.00	Kz	3	3	scheduled		\N	2026-02-04 23:13:02.778286+00	2026-02-04 23:13:02.778286+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
47e7a540-a2f0-4851-ba9b-f7e91c9baec9	111bfc05-083e-425d-8d2c-4680f9f91d50	e1b2cc62-58d1-49e6-8454-54a56c67fca1	Benguela	Lobito	\N	2026-02-08 08:00:00+00	\N	4500.00	Kz	3	3	scheduled		\N	2026-02-05 20:32:52.659209+00	2026-02-05 20:32:52.659209+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
79bb36ab-abe0-4ab6-ba90-aa5bbd87aae1	111bfc05-083e-425d-8d2c-4680f9f91d50	e1b2cc62-58d1-49e6-8454-54a56c67fca1	Bengo	Sumbe	\N	2026-04-04 08:00:00+00	\N	5000.00	Kz	3	3	scheduled		\N	2026-02-05 20:46:11.737043+00	2026-02-05 20:46:11.737043+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
db8f046f-ebca-4c1f-8159-3aef46617512	d1c7810e-7f24-407d-a7ee-02e2383a28b1	2836e6d9-ed8f-473c-9502-28253d086edc	GOLF	BELGRADE	\N	2026-02-10 10:00:00+00	\N	8000.00	Kz	4	3	scheduled		\N	2026-02-05 20:48:20.198943+00	2026-02-05 20:48:20.198943+00	medium	\N	WEEKDAYS	\N	\N	\N	\N	\N	auto	0	f	f	f
695efb61-eddc-4f3d-8573-32d9e793c571	111bfc05-083e-425d-8d2c-4680f9f91d50	e1b2cc62-58d1-49e6-8454-54a56c67fca1	huambo	Bie	\N	2026-02-06 06:00:00+00	\N	4500.00	Kz	4	3	scheduled		\N	2026-02-05 20:37:48.812232+00	2026-02-05 20:37:48.812232+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
9a7298c3-d084-4e33-a962-fe33f60966e6	64600275-8aa4-437a-9337-6bb2e0949e19	be617cd5-abd6-4baf-b54f-d4d7c9e44330	Luanda	Benguela	\N	2026-01-24 03:24:41.969358+00	\N	5000.00	Kz	4	3	scheduled	Viagem confortável saindo da Mutamba. Ar condicionado ligado.	{"pets": false, "music": true, "smoking": false}	2026-01-23 03:24:41.969358+00	2026-01-23 03:24:41.969358+00	medium	\N	UNIQUE	\N	\N	MEDIUM	NONE	FIFTEEN_MINUTES	manual	0	f	f	f
e02fde5e-02ca-4c25-b361-609bc2fdd2d3	d1c7810e-7f24-407d-a7ee-02e2383a28b1	241f20da-780e-4037-ba54-5a6207509569	KILAMBA KIAXI	JACARÉ	\N	2026-02-10 15:00:00+00	\N	7000.00	Kz	4	3	scheduled		\N	2026-02-05 20:31:53.977008+00	2026-02-05 20:31:53.977008+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
44b7c3dd-df6a-4c47-80f4-234b01bcb26d	64600275-8aa4-437a-9337-6bb2e0949e19	be617cd5-abd6-4baf-b54f-d4d7c9e44330	Luanda	Huambo	\N	2026-01-25 03:24:41.969358+00	\N	7000.00	Kz	4	3	scheduled	Viagem para o Huambo. Saída cedo.	{"pets": false, "music": true, "smoking": false}	2026-01-23 03:24:41.969358+00	2026-01-23 03:24:41.969358+00	medium	\N	UNIQUE	\N	\N	MEDIUM	NONE	FIFTEEN_MINUTES	manual	0	f	f	f
1712f120-170d-4623-8bb1-bad8e20675f0	b2368d8c-20f5-497f-aefc-e378263f1b89	3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	Congolense	Vila de Viana	\N	2026-02-08 11:00:00+00	\N	5000.00	Kz	4	3	scheduled		\N	2026-02-06 20:22:47.236185+00	2026-02-06 20:22:47.236185+00	small	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
734cb63f-cd96-4ef7-853d-da9be2257a10	b2368d8c-20f5-497f-aefc-e378263f1b89	3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	VIANA	GOLF	\N	2026-02-10 10:00:00+00	\N	10000.00	Kz	2	2	scheduled		\N	2026-02-06 20:29:49.339359+00	2026-02-06 20:29:49.339359+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
d8cdceaa-698e-4753-9cd0-609701746376	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	b68c4dfc-731c-45ed-a9ff-633253b5a571	Subzona 6	Subzona 15	\N	2026-02-07 05:00:00+00	\N	2500.00	Kz	2	0	scheduled		\N	2026-02-06 21:02:32.511153+00	2026-02-06 21:02:32.511153+00	medium	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
c71b9dbb-a901-438b-9ec3-4db19640508d	b2368d8c-20f5-497f-aefc-e378263f1b89	3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	MARTA	ENOQUE	\N	2026-03-07 06:00:00+00	\N	3000.00	Kz	1	17	scheduled		\N	2026-02-06 21:16:41.496958+00	2026-02-06 21:16:41.496958+00	large	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
bce68715-1527-447d-8d79-302a31d0847d	b2368d8c-20f5-497f-aefc-e378263f1b89	3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	DE OSORIO	PARA CLEMENTINO	\N	2026-03-14 14:30:00+00	\N	4000.00	Kz	4	5	scheduled		\N	2026-02-06 20:39:11.673206+00	2026-02-06 20:39:11.673206+00	small	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
694fe1c7-91bf-4f4b-b0fd-41be5edc5041	b2368d8c-20f5-497f-aefc-e378263f1b89	3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	OZORIO	TITA	\N	2026-03-07 10:30:00+00	\N	1500.00	Kz	2	0	scheduled		\N	2026-02-06 21:28:50.343842+00	2026-02-06 21:28:50.343842+00	small	\N	WEEKLY	\N	\N	\N	\N	\N	auto	0	f	f	f
35803811-5c9e-4e66-9a69-e3aaec5ff21e	63d5a899-7506-4d78-a5e6-3aded1d23053	22712365-efaa-4f29-a1eb-09fd02e601d9	AVO CUMBI	GOLF 3	\N	2026-02-10 10:00:00+00	\N	10000.00	Kz	4	3	scheduled		\N	2026-02-08 16:12:04.375003+00	2026-02-08 16:12:04.375003+00	small	\N	UNIQUE	\N	\N	\N	\N	\N	manual	0	f	f	f
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, description, updated_at) FROM stdin;
b458a05a-df04-40ed-8151-a57a8837f409	commission_rate	15	Taxa de comissão do sistema em porcentagem (%)	2026-01-29 02:57:49.478716+00
eeb4ee5b-0820-4c62-b547-529a74092494	min_commission	500	Valor mínimo de comissão em AOA	2026-01-29 02:57:49.478716+00
049f9d26-a09f-46b5-9a80-52674b6decb8	app_name	"Boleia Angola"	Nome oficial da plataforma	2026-01-29 02:57:49.478716+00
02dc9b22-f157-46c0-bd26-68633d61293d	support_email	"suporte@boleiaangola.com"	Email de suporte ao cliente	2026-01-29 02:57:49.478716+00
1e6766d8-d256-4192-aa35-04067073116d	support_phone	"+244 923 000 000"	Telefone de suporte oficial	2026-01-29 02:57:49.478716+00
aa49b55e-3f46-420d-a97a-ad5269bc469f	maintenance_mode	false	Ativa o modo de manutenção em todo o sistema	2026-01-29 02:57:49.478716+00
e0e9ae66-6eb8-439d-b8f0-7853c3be9156	social_links	{"twitter": "https://twitter.com/boleiaangola", "facebook": "https://facebook.com/boleiaangola", "instagram": "https://instagram.com/boleiaangola"}	Links para redes sociais oficiais	2026-01-29 02:57:49.478716+00
\.


--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vehicles (id, owner_id, make, model, year, color, plate, seats_capacity, photo_url, is_active, created_at, category, comfort_level, comfort_stars, pictures, is_verified, updated_at) FROM stdin;
be617cd5-abd6-4baf-b54f-d4d7c9e44330	64600275-8aa4-437a-9337-6bb2e0949e19	Toyota	Land Cruiser	2022	Preto	LD-88-99-CC	7	/images/about-road.png	t	2026-01-23 03:24:41.969358+00	\N	\N	\N	[]	f	2026-01-29 00:27:54.142243+00
e1b2cc62-58d1-49e6-8454-54a56c67fca1	111bfc05-083e-425d-8d2c-4680f9f91d50	iuwfa	hjds	2026	hSD	n sdkjbjvs	4	/images/about-road.png	t	2026-02-04 23:04:14.475903+00	SEDAN	NORMAL	\N	[]	f	2026-02-04 23:04:14.475903+00
241f20da-780e-4037-ba54-5a6207509569	d1c7810e-7f24-407d-a7ee-02e2383a28b1	DDDD	DFF	2026	FFG	DRF	4	/images/about-road.png	t	2026-02-04 23:11:59.810321+00	SEDAN	NORMAL	\N	[]	f	2026-02-04 23:11:59.810321+00
2836e6d9-ed8f-473c-9502-28253d086edc	d1c7810e-7f24-407d-a7ee-02e2383a28b1	MERCEDES	ANYGO	2026	AMARELA	LD-05-05	6	\N	t	2026-02-05 20:43:31.170861+00	SEDAN	NORMAL	\N	[]	f	2026-02-05 20:43:31.170861+00
b68c4dfc-731c-45ed-a9ff-633253b5a571	02b006ff-bb39-4e0a-9890-aebe11b2d4e3	Vjjj	Jjj	2026	Ggg	Ghi	4	\N	t	2026-02-06 09:20:40.528013+00	SEDAN	NORMAL	\N	[]	f	2026-02-06 09:20:40.528013+00
3c23dcdb-7bbc-48a2-9dc1-9c82ee9efa92	b2368d8c-20f5-497f-aefc-e378263f1b89	AVIÃO	TAAG	2026	AMARELO	LD 20 20	8	\N	t	2026-02-06 20:19:53.11276+00	SEDAN	NORMAL	\N	[]	f	2026-02-06 20:19:53.11276+00
22712365-efaa-4f29-a1eb-09fd02e601d9	63d5a899-7506-4d78-a5e6-3aded1d23053	Woda	Raros	2000	Amarelo	LD 10 10	8	\N	t	2026-02-08 16:04:36.266425+00	TOURISM	LUXURY	\N	[]	f	2026-02-08 16:04:36.266425+00
\.


--
-- Data for Name: waypoints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.waypoints (id, ride_id, order_index, type, city, address, country_code, arrival_datetime, departure_datetime, price_to_next, created_at) FROM stdin;
\.


--
-- Name: auth_credentials auth_credentials_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_credentials
    ADD CONSTRAINT auth_credentials_email_key UNIQUE (email);


--
-- Name: auth_credentials auth_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_credentials
    ADD CONSTRAINT auth_credentials_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: rides rides_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (id);


--
-- Name: waypoints waypoints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waypoints
    ADD CONSTRAINT waypoints_pkey PRIMARY KEY (id);


--
-- Name: idx_auth_credentials_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_auth_credentials_email ON public.auth_credentials USING btree (email);


--
-- Name: auth_credentials auth_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_credentials
    ADD CONSTRAINT auth_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_passenger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_passenger_id_fkey FOREIGN KEY (passenger_id) REFERENCES public.profiles(id);


--
-- Name: bookings bookings_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: messages messages_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id);


--
-- Name: messages messages_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- Name: reviews reviews_reviewee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewee_id_fkey FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id);


--
-- Name: reviews reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id);


--
-- Name: reviews reviews_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.rides(id);


--
-- Name: rides rides_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: rides rides_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rides
    ADD CONSTRAINT rides_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id);


--
-- Name: vehicles vehicles_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: waypoints waypoints_ride_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.waypoints
    ADD CONSTRAINT waypoints_ride_id_fkey FOREIGN KEY (ride_id) REFERENCES public.rides(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: TABLE auth_credentials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.auth_credentials TO boleia_user;


--
-- Name: TABLE bookings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bookings TO boleia_user;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO boleia_user;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.profiles TO boleia_user;


--
-- Name: TABLE reviews; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.reviews TO boleia_user;


--
-- Name: TABLE rides; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rides TO boleia_user;


--
-- Name: TABLE system_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_settings TO boleia_user;


--
-- Name: TABLE vehicles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vehicles TO boleia_user;


--
-- Name: TABLE waypoints; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.waypoints TO boleia_user;


--
-- PostgreSQL database dump complete
--

\unrestrict n7BgzaThco7aAyfUXfHqo78oQCZIuLuaTukQfRJIeEWa0NghsEtXQfb3pCplwiK

