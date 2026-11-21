-- DEMO CATALOGUE — for previewing the website only. NOT real company data.
--
-- Run AFTER all migration files, in the Supabase SQL Editor.
-- Every demo product code starts with "DEMO-". Before launch, run
-- supabase/seed/remove_demo_catalogue.sql to delete all of it.
-- Category names follow the examples in the PRD; the client supplies the real ones.

begin;

insert into public.categories (name, slug, description, is_published, display_order) values
  ('Medical Equipment', 'medical-equipment', 'Monitoring, diagnostic and therapy equipment for clinical settings.', true, 1),
  ('Surgical Instruments', 'surgical-instruments', 'Stainless steel instruments for general and specialist surgery.', true, 2),
  ('Dental Products', 'dental-products', 'Handpieces, instruments and consumables for dental practices.', true, 3),
  ('Hospital Supplies', 'hospital-supplies', 'Consumables, protective wear and ward essentials.', true, 4)
on conflict (slug) do nothing;

insert into public.subcategories (category_id, name, slug, is_published, display_order)
select c.id, s.name, s.slug, true, s.ord
from (values
  ('medical-equipment', 'Patient Monitoring', 'patient-monitoring', 1),
  ('medical-equipment', 'Infusion & Therapy', 'infusion-therapy', 2),
  ('medical-equipment', 'Diagnostics', 'diagnostics', 3),
  ('surgical-instruments', 'Scissors', 'scissors', 1),
  ('surgical-instruments', 'Forceps & Clamps', 'forceps-clamps', 2),
  ('surgical-instruments', 'Retractors', 'retractors', 3),
  ('dental-products', 'Handpieces', 'handpieces', 1),
  ('dental-products', 'Dental Instruments', 'dental-instruments', 2),
  ('hospital-supplies', 'Protective Wear', 'protective-wear', 1),
  ('hospital-supplies', 'Disposables', 'disposables', 2)
) as s(cat, name, slug, ord)
join public.categories c on c.slug = s.cat
on conflict (category_id, slug) do nothing;

insert into public.products
  (category_id, subcategory_id, name, slug, product_code, short_description, description, specifications, is_featured, featured_order, is_published)
select c.id, sc.id, p.name, p.slug, p.code, p.short, p.descr, p.specs::jsonb, p.featured, p.ford, true
from (values
  ('medical-equipment','patient-monitoring','Multi-Parameter Patient Monitor','multi-parameter-patient-monitor','DEMO-PM-100',
   'Bedside monitor for ECG, SpO2, NIBP, respiration and temperature.',
   'A bedside multi-parameter monitor for continuous observation in wards, recovery and emergency settings. Configuration and accessories vary by model; confirm requirements in your quotation request.',
   '[{"label":"Parameters","value":"ECG, SpO2, NIBP, RESP, TEMP"},{"label":"Display","value":"12.1 in colour"},{"label":"Power","value":"AC / internal battery"}]', true, 1),
  ('medical-equipment','patient-monitoring','Fingertip Pulse Oximeter','fingertip-pulse-oximeter','DEMO-PM-210',
   'Compact SpO2 and pulse-rate measurement for spot checks.',
   'Portable fingertip oximeter for spot-check measurement of oxygen saturation and pulse rate.',
   '[{"label":"Measures","value":"SpO2, pulse rate"},{"label":"Power","value":"2 × AAA"}]', false, 0),
  ('medical-equipment','infusion-therapy','Volumetric Infusion Pump','volumetric-infusion-pump','DEMO-IP-400',
   'Programmable infusion pump with occlusion and air-in-line alarms.',
   'Volumetric infusion pump for controlled delivery of fluids and medication.',
   '[{"label":"Flow rate","value":"0.1–1200 ml/h"},{"label":"Alarms","value":"Occlusion, air-in-line, door open"}]', true, 2),
  ('medical-equipment','infusion-therapy','Syringe Pump','syringe-pump','DEMO-IP-420',
   'Precision syringe driver for low-volume infusions.',
   'Syringe pump compatible with common syringe sizes for precise low-volume delivery.',
   '[{"label":"Syringe sizes","value":"5, 10, 20, 30, 50/60 ml"}]', false, 0),
  ('medical-equipment','diagnostics','LED Surgical Light','led-surgical-light','DEMO-SL-200',
   'Ceiling-mounted LED examination and surgical light.',
   'Shadow-reducing LED light head for operating and procedure rooms.',
   '[{"label":"Light source","value":"LED"},{"label":"Mounting","value":"Ceiling"}]', true, 3),
  ('medical-equipment','diagnostics','Digital Blood Pressure Monitor','digital-blood-pressure-monitor','DEMO-DX-310',
   'Automatic upper-arm blood pressure monitor.',
   'Automatic oscillometric blood pressure monitor for clinical and home-care use.',
   '[{"label":"Cuff","value":"Adult, 22–42 cm"}]', false, 0),
  ('surgical-instruments','scissors','Mayo Dissecting Scissors, Curved','mayo-dissecting-scissors-curved','DEMO-SI-101',
   'Curved Mayo scissors for cutting heavy tissue and sutures.',
   'Stainless steel Mayo dissecting scissors with curved blades.',
   '[{"label":"Length","value":"17 cm"},{"label":"Material","value":"Stainless steel"},{"label":"Blade","value":"Curved"}]', true, 4),
  ('surgical-instruments','scissors','Metzenbaum Scissors','metzenbaum-scissors','DEMO-SI-104',
   'Fine dissecting scissors for delicate tissue.',
   'Metzenbaum dissecting scissors with long handles and short blades.',
   '[{"label":"Length","value":"18 cm"},{"label":"Material","value":"Stainless steel"}]', false, 0),
  ('surgical-instruments','forceps-clamps','Kelly Haemostatic Forceps','kelly-haemostatic-forceps','DEMO-SI-210',
   'Haemostatic forceps for clamping vessels.',
   'Kelly forceps with serrated jaws and ratchet lock.',
   '[{"label":"Length","value":"14 cm"},{"label":"Jaw","value":"Straight, serrated"}]', false, 0),
  ('surgical-instruments','forceps-clamps','Adson Tissue Forceps','adson-tissue-forceps','DEMO-SI-215',
   'Fine-toothed forceps for handling delicate tissue.',
   'Adson tissue forceps, 1×2 teeth.',
   '[{"label":"Length","value":"12 cm"},{"label":"Tips","value":"1×2 teeth"}]', false, 0),
  ('surgical-instruments','forceps-clamps','Surgical Instrument Set, General','surgical-instrument-set-general','DEMO-SI-300',
   'Basic general surgery set in a perforated tray.',
   'General surgery instrument set. Contents are configurable on request.',
   '[{"label":"Contents","value":"Configurable"},{"label":"Tray","value":"Perforated stainless steel"}]', true, 5),
  ('surgical-instruments','retractors','Langenbeck Retractor','langenbeck-retractor','DEMO-SI-410',
   'Hand-held retractor for superficial wounds.',
   'Langenbeck retractor with right-angled blade.',
   '[{"label":"Blade","value":"40 × 10 mm"}]', false, 0),
  ('dental-products','handpieces','High-Speed Dental Handpiece','high-speed-dental-handpiece','DEMO-DH-500',
   'Air-turbine handpiece with push-button chuck.',
   'High-speed dental air-turbine handpiece.',
   '[{"label":"Type","value":"Air turbine"},{"label":"Chuck","value":"Push button"}]', true, 6),
  ('dental-products','handpieces','Low-Speed Contra-Angle Handpiece','low-speed-contra-angle-handpiece','DEMO-DH-520',
   'Contra-angle handpiece for low-speed procedures.',
   'Low-speed contra-angle handpiece.',
   '[{"label":"Ratio","value":"1:1"}]', false, 0),
  ('dental-products','dental-instruments','Dental Examination Kit','dental-examination-kit','DEMO-DI-610',
   'Mirror, explorer and tweezers for routine examination.',
   'Basic dental examination instrument kit.',
   '[{"label":"Contents","value":"Mirror, explorer, tweezers"}]', false, 0),
  ('dental-products','dental-instruments','Dental Extraction Forceps','dental-extraction-forceps','DEMO-DI-640',
   'Extraction forceps for upper molars.',
   'Dental extraction forceps.',
   '[{"label":"Pattern","value":"Upper molars"}]', false, 0),
  ('hospital-supplies','protective-wear','Surgical Face Mask, 3-Ply','surgical-face-mask-3-ply','DEMO-SM-600',
   'Three-layer disposable face mask with ear loops.',
   'Disposable 3-ply surgical face mask.',
   '[{"label":"Layers","value":"3"},{"label":"Fastening","value":"Ear loops"},{"label":"Packing","value":"50 per box"}]', true, 7),
  ('hospital-supplies','protective-wear','Nitrile Examination Gloves','nitrile-examination-gloves','DEMO-PW-620',
   'Powder-free nitrile gloves, multiple sizes.',
   'Powder-free nitrile examination gloves.',
   '[{"label":"Sizes","value":"S, M, L, XL"},{"label":"Packing","value":"100 per box"}]', false, 0),
  ('hospital-supplies','protective-wear','Disposable Isolation Gown','disposable-isolation-gown','DEMO-PW-640',
   'Fluid-resistant isolation gown with knitted cuffs.',
   'Disposable isolation gown.',
   '[{"label":"Cuffs","value":"Knitted"}]', false, 0),
  ('hospital-supplies','disposables','Sterile Disposable Syringe','sterile-disposable-syringe','DEMO-DS-700',
   'Single-use sterile syringe, luer slip.',
   'Single-use sterile syringe.',
   '[{"label":"Volumes","value":"1, 3, 5, 10, 20 ml"},{"label":"Tip","value":"Luer slip"}]', true, 8),
  ('hospital-supplies','disposables','IV Cannula','iv-cannula','DEMO-DS-720',
   'Peripheral IV cannula with injection port.',
   'Peripheral intravenous cannula.',
   '[{"label":"Gauges","value":"18G – 24G"}]', false, 0),
  ('hospital-supplies','disposables','Sterile Gauze Swabs','sterile-gauze-swabs','DEMO-DS-740',
   'Absorbent cotton gauze swabs, sterile packed.',
   'Sterile cotton gauze swabs.',
   '[{"label":"Size","value":"10 × 10 cm"},{"label":"Ply","value":"8"}]', false, 0)
) as p(cat, sub, name, slug, code, short, descr, specs, featured, ford)
join public.categories c on c.slug = p.cat
left join public.subcategories sc on sc.category_id = c.id and sc.slug = p.sub
on conflict (slug) do nothing;

commit;
