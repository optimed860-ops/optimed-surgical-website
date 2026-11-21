-- OPTIMED SURGICAL · STARTER PRODUCT CATALOGUE (25 instruments)
--
-- Run in the Supabase SQL Editor AFTER the migration files.
-- Standard, generic instrument patterns grouped by surgical discipline.
-- Descriptions are original Optimed copy. No prices. Product codes are left
-- empty so the client can add their own item numbers later (admin panel).
-- pendingClientReview: confirm sizes, finishes and that each item is offered.
-- Safe to run more than once (existing slugs are left unchanged).

begin;

-- ── Categories (surgical disciplines) ─────────────────────────────────────────
insert into public.categories (name, slug, description, is_published, display_order) values
  ('General Surgery', 'general-surgery', 'Scissors, forceps, needle holders and scalpel handles for everyday surgical procedures.', true, 1),
  ('Retractors', 'retractors', 'Hand-held and self-retaining retractors for clear access to the surgical field.', true, 2),
  ('Cardiovascular Surgery', 'cardiovascular-surgery', 'Atraumatic forceps, vascular scissors and clamps for cardiovascular procedures.', true, 3),
  ('ENT Surgery', 'ent-surgery', 'Instruments for ear, nose and throat examination and surgery.', true, 4),
  ('Neurosurgery', 'neurosurgery', 'Rongeurs, dissectors and micro instruments for spinal and cranial surgery.', true, 5),
  ('Gynaecology', 'gynaecology', 'Specula, tenacula and dilators for gynaecological examination and surgery.', true, 6),
  ('Orthopaedic Surgery', 'orthopaedic-surgery', 'Bone cutters, rongeurs and curettes for orthopaedic procedures.', true, 7),
  ('Dental Surgery', 'dental-surgery', 'Extraction forceps, elevators and examination instruments for dental practice.', true, 8)
on conflict (slug) do nothing;

-- ── Products ──────────────────────────────────────────────────────────────────
insert into public.products
  (category_id, name, slug, short_description, description, specifications, is_featured, featured_order, is_published)
select c.id, p.name, p.slug, p.short, p.descr, p.specs::jsonb, p.featured, p.ford, true
from (values
  -- General Surgery
  ('general-surgery', 'Mayo Dissecting Scissors, Curved', 'mayo-dissecting-scissors-curved',
   'Heavy-duty curved scissors for cutting dense tissue and sutures.',
   'A robust pattern for dissecting heavy tissue such as fascia and muscle. Curved, bevelled blades with a firm, smooth cutting action and comfortable ring handles.',
   '[{"label":"Lengths","value":"14.5 cm, 17 cm, 23 cm"},{"label":"Blades","value":"Curved, bevelled"},{"label":"Material","value":"Surgical-grade stainless steel"},{"label":"Finish","value":"Satin"},{"label":"Reusable","value":"Yes, autoclavable"}]', true, 1),
  ('general-surgery', 'Metzenbaum Dissecting Scissors', 'metzenbaum-dissecting-scissors',
   'Long-handled, short-bladed scissors for fine dissection of delicate tissue.',
   'Designed for precise work on delicate tissue, with long shanks for reach and short, blunt-tipped blades for control.',
   '[{"label":"Lengths","value":"14 cm, 18 cm, 20 cm, 23 cm"},{"label":"Blades","value":"Straight or curved, blunt/blunt"},{"label":"Material","value":"Surgical-grade stainless steel"},{"label":"Options","value":"Tungsten carbide inserts on request"}]', true, 2),
  ('general-surgery', 'Kelly Haemostatic Forceps', 'kelly-haemostatic-forceps',
   'Haemostatic forceps with half-serrated jaws and ratchet lock.',
   'A versatile haemostat for clamping vessels and grasping tissue. Transverse serrations on the distal half of the jaws and a secure three-step ratchet.',
   '[{"label":"Length","value":"14 cm"},{"label":"Jaws","value":"Straight or curved, half serrated"},{"label":"Lock","value":"Three-step ratchet"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 3),
  ('general-surgery', 'Adson Tissue Forceps, 1x2 Teeth', 'adson-tissue-forceps-1x2-teeth',
   'Fine-tipped forceps with 1x2 teeth for handling delicate tissue and skin.',
   'A light, precise forceps with a broad thumb grip and fine 1x2 toothed tips, widely used for skin closure and delicate tissue handling.',
   '[{"label":"Length","value":"12 cm"},{"label":"Tips","value":"1x2 teeth"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('general-surgery', 'Mayo-Hegar Needle Holder', 'mayo-hegar-needle-holder',
   'Needle holder with cross-serrated jaws for secure suturing.',
   'A dependable needle holder with cross-serrated jaws and a central groove for a firm grip on needles, finished with a smooth ratchet.',
   '[{"label":"Lengths","value":"14 cm, 16 cm, 18 cm, 20 cm"},{"label":"Jaws","value":"Cross serrated; tungsten carbide on request"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 4),
  ('general-surgery', 'Scalpel Handle No. 3', 'scalpel-handle-no-3',
   'Standard scalpel handle for blade sizes 10 to 15.',
   'A balanced, flat scalpel handle with a ribbed grip area, compatible with standard detachable blades.',
   '[{"label":"Fits blades","value":"No. 10, 11, 12, 15"},{"label":"Graduation","value":"Metric scale on request"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  -- Retractors
  ('retractors', 'Langenbeck Retractor', 'langenbeck-retractor',
   'Hand-held retractor with a right-angled blade for superficial wounds.',
   'A classic hand-held retractor with a flat, right-angled blade and a hollow handle for a light, steady grip.',
   '[{"label":"Blade sizes","value":"28x10 mm to 60x13 mm"},{"label":"Length","value":"21 cm"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('retractors', 'Weitlaner Self-Retaining Retractor', 'weitlaner-self-retaining-retractor',
   'Self-retaining retractor with ratchet and sharp or blunt prongs.',
   'Holds the wound open without an assistant. Spreading arms with 3x4 prongs and a reliable ratchet lock.',
   '[{"label":"Lengths","value":"11 cm, 14 cm, 16.5 cm"},{"label":"Prongs","value":"3x4, sharp or blunt"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 5),
  ('retractors', 'Senn Retractor, Double-Ended', 'senn-retractor-double-ended',
   'Double-ended retractor with a three-prong rake and a flat blade.',
   'A small, double-ended retractor for superficial procedures, with a three-pronged rake at one end and a right-angled blade at the other.',
   '[{"label":"Length","value":"16 cm"},{"label":"Ends","value":"Three-prong rake, flat blade"},{"label":"Prongs","value":"Sharp or blunt"}]', false, 0),
  -- Cardiovascular
  ('cardiovascular-surgery', 'DeBakey Atraumatic Forceps', 'debakey-atraumatic-forceps',
   'Atraumatic tissue forceps with fine longitudinal teeth for vessels.',
   'Gently grasps vessels and delicate tissue without crushing, thanks to the fine, atraumatic DeBakey tooth pattern.',
   '[{"label":"Lengths","value":"15 cm, 20 cm, 24 cm"},{"label":"Jaw width","value":"1.5 mm, 2 mm, 2.8 mm"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 6),
  ('cardiovascular-surgery', 'Potts-Smith Vascular Scissors', 'potts-smith-vascular-scissors',
   'Angled fine scissors for arteriotomy and vessel work.',
   'Delicate angled scissors for opening and trimming vessels, with sharp, fine blades and a light spring action.',
   '[{"label":"Length","value":"19 cm"},{"label":"Blade angle","value":"25°, 45°, 60°"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('cardiovascular-surgery', 'Satinsky Vascular Clamp', 'satinsky-vascular-clamp',
   'Partial-occlusion vascular clamp with atraumatic jaws.',
   'Allows partial occlusion of large vessels, with curved atraumatic DeBakey jaws and a secure ratchet.',
   '[{"label":"Length","value":"25 cm"},{"label":"Jaws","value":"Atraumatic, angled"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  -- ENT
  ('ent-surgery', 'Hartmann Ear Forceps', 'hartmann-ear-forceps',
   'Fine alligator-style forceps for the ear canal.',
   'Slender alligator forceps for removing foreign bodies and handling tissue in the ear canal, with fine serrated jaws.',
   '[{"label":"Shaft length","value":"8 cm"},{"label":"Jaws","value":"Serrated, 0.8 mm to 1.5 mm"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('ent-surgery', 'Killian Nasal Speculum', 'killian-nasal-speculum',
   'Long-bladed nasal speculum for septal and nasal procedures.',
   'Provides wide, steady access to the nasal cavity, with long smooth blades in a choice of lengths.',
   '[{"label":"Blade lengths","value":"50 mm, 65 mm, 75 mm"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 7),
  ('ent-surgery', 'Tilley Nasal Dressing Forceps', 'tilley-nasal-dressing-forceps',
   'Bayonet-shaped forceps for placing nasal packing and dressings.',
   'Bayonet-angled forceps that keep the hand out of the line of sight while placing packing in the nasal cavity.',
   '[{"label":"Length","value":"14 cm"},{"label":"Jaws","value":"Serrated"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  -- Neurosurgery
  ('neurosurgery', 'Kerrison Rongeur, 40°', 'kerrison-rongeur-40',
   'Spinal rongeur for precise bone removal in laminectomy.',
   'A precision rongeur for removing bone in spinal surgery, with a 40° up-cutting footplate and smooth, positive action.',
   '[{"label":"Bite sizes","value":"1 mm to 5 mm"},{"label":"Shaft length","value":"18 cm"},{"label":"Options","value":"Detachable or ejector models"},{"label":"Material","value":"Surgical-grade stainless steel"}]', true, 8),
  ('neurosurgery', 'Penfield Dissector No. 4', 'penfield-dissector-no-4',
   'Double-ended dissector for blunt dissection in neurosurgery.',
   'A double-ended dissector with blunt, polished working ends for separating tissue planes with care.',
   '[{"label":"Length","value":"19 cm"},{"label":"Sizes","value":"No. 1 to No. 5"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('neurosurgery', 'Micro Bayonet Scissors', 'micro-bayonet-scissors',
   'Bayonet-shaped micro scissors for microsurgical work.',
   'Fine, bayonet-shaped micro scissors that keep the operating field visible under the microscope.',
   '[{"label":"Length","value":"22.5 cm"},{"label":"Blades","value":"Straight or curved"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  -- Gynaecology
  ('gynaecology', 'Sims Vaginal Speculum', 'sims-vaginal-speculum',
   'Double-ended speculum for vaginal examination and surgery.',
   'A double-ended speculum with smooth, concave blades of two sizes for gynaecological examination and procedures.',
   '[{"label":"Sizes","value":"Small, medium, large"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('gynaecology', 'Pozzi Tenaculum Forceps', 'pozzi-tenaculum-forceps',
   'Tenaculum forceps for grasping and steadying the cervix.',
   'A long tenaculum with fine, sharp, curved points and a ratchet lock for a secure hold on the cervix.',
   '[{"label":"Length","value":"25 cm"},{"label":"Tips","value":"Curved, sharp"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('gynaecology', 'Hegar Uterine Dilators, Set', 'hegar-uterine-dilators-set',
   'Graduated double-ended uterine dilators, supplied as a set.',
   'Smooth, graduated dilators for gradual cervical dilation, supplied as a complete set in a stand or case.',
   '[{"label":"Range","value":"1 mm to 26 mm"},{"label":"Type","value":"Double-ended"},{"label":"Supplied","value":"Set with rack or case"}]', false, 0),
  -- Orthopaedic
  ('orthopaedic-surgery', 'Liston Bone Cutting Forceps', 'liston-bone-cutting-forceps',
   'Heavy bone cutting forceps with straight or angled jaws.',
   'A strong bone cutter for trimming and dividing bone, with hardened cutting edges and long handles for leverage.',
   '[{"label":"Lengths","value":"14 cm, 18 cm, 24 cm"},{"label":"Jaws","value":"Straight or angled"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  ('orthopaedic-surgery', 'Volkmann Bone Curette', 'volkmann-bone-curette',
   'Double-ended bone curette with sharp oval cups.',
   'For scraping and removing bone and tissue, with sharp, oval cups on both ends in a range of sizes.',
   '[{"label":"Length","value":"17 cm"},{"label":"Cup sizes","value":"Fig. 0 to Fig. 6"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0),
  -- Dental
  ('dental-surgery', 'Dental Extraction Forceps, Upper Molars', 'dental-extraction-forceps-upper-molars',
   'Extraction forceps shaped for upper molars.',
   'English-pattern extraction forceps with anatomically shaped beaks for upper molars and a secure, non-slip grip.',
   '[{"label":"Pattern","value":"English, Fig. 17 and 18"},{"label":"Material","value":"Surgical-grade stainless steel"},{"label":"Range","value":"Full upper and lower series available"}]', false, 0),
  ('dental-surgery', 'Coupland Dental Elevator', 'coupland-dental-elevator',
   'Straight dental elevator for luxating teeth and roots.',
   'A straight elevator with a fluted handle and a sharp, gently curved blade for luxating teeth and roots before extraction.',
   '[{"label":"Blade sizes","value":"No. 1, 2, 3"},{"label":"Handle","value":"Fluted, ergonomic"},{"label":"Material","value":"Surgical-grade stainless steel"}]', false, 0)
) as p(cat, name, slug, short, descr, specs, featured, ford)
join public.categories c on c.slug = p.cat
on conflict (slug) do nothing;

commit;
