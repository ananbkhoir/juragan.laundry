/* Parameter keseimbangan Juragan Laundry. Dibaca game & admin.html.
   def = nilai bawaan di kode game. Ubah nilainya lewat halaman admin, bukan di sini. */
window.JL_BALANCE_DEFS=[
  {"key": "item.washer_s.time", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci 7 kg · waktu proses", "unit": "dtk", "def": 18, "min": 1, "max": 300, "step": 1},
  {"key": "item.washer_s.price", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci 7 kg · harga", "unit": "Rp", "def": 1500000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dcmachine.time", "group": "Mesin & alat", "sub": "Mesin cuci kimia", "label": "Mesin Cuci Kimia · waktu proses", "unit": "dtk", "def": 30, "min": 1, "max": 300, "step": 1},
  {"key": "item.dcmachine.price", "group": "Mesin & alat", "sub": "Mesin cuci kimia", "label": "Mesin Cuci Kimia · harga", "unit": "Rp", "def": 14000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.washer_l.time", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci 15 kg · waktu proses", "unit": "dtk", "def": 15, "min": 1, "max": 300, "step": 1},
  {"key": "item.washer_l.price", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci 15 kg · harga", "unit": "Rp", "def": 5000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.washer_x.time", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci Industri · waktu proses", "unit": "dtk", "def": 9, "min": 1, "max": 300, "step": 1},
  {"key": "item.washer_x.price", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci Industri · harga", "unit": "Rp", "def": 16000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.rack_dry.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Lipat Dalam Ruangan · waktu proses", "unit": "dtk", "def": 30, "min": 1, "max": 300, "step": 1},
  {"key": "item.rack_dry.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Lipat Dalam Ruangan · harga", "unit": "Rp", "def": 150000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.rack_tier.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Besi Bertingkat · waktu proses", "unit": "dtk", "def": 34, "min": 1, "max": 300, "step": 1},
  {"key": "item.rack_tier.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Besi Bertingkat · harga", "unit": "Rp", "def": 400000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.rack_fan.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Berkipas · waktu proses", "unit": "dtk", "def": 26, "min": 1, "max": 300, "step": 1},
  {"key": "item.rack_fan.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Jemuran Berkipas · harga", "unit": "Rp", "def": 900000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dryer_s.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Gas · waktu proses", "unit": "dtk", "def": 18, "min": 1, "max": 300, "step": 1},
  {"key": "item.dryer_s.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Gas · harga", "unit": "Rp", "def": 1300000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dryer_l.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Turbo · waktu proses", "unit": "dtk", "def": 11, "min": 1, "max": 300, "step": 1},
  {"key": "item.dryer_l.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Turbo · harga", "unit": "Rp", "def": 4500000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dryer_hp.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Pompa Panas · waktu proses", "unit": "dtk", "def": 10, "min": 1, "max": 300, "step": 1},
  {"key": "item.dryer_hp.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Pompa Panas · harga", "unit": "Rp", "def": 9000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dryer_ind.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Industri 50 kg · waktu proses", "unit": "dtk", "def": 7, "min": 1, "max": 300, "step": 1},
  {"key": "item.dryer_ind.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Industri 50 kg · harga", "unit": "Rp", "def": 18000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.dryer_tunnel.time", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Terowongan Otomatis · waktu proses", "unit": "dtk", "def": 4, "min": 1, "max": 300, "step": 1},
  {"key": "item.dryer_tunnel.price", "group": "Mesin & alat", "sub": "Pengering & jemuran", "label": "Pengering Terowongan Otomatis · harga", "unit": "Rp", "def": 45000000, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.washer_gold.time", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci Emas · waktu proses", "unit": "dtk", "def": 7, "min": 1, "max": 300, "step": 1},
  {"key": "item.washer_gold.price", "group": "Mesin & alat", "sub": "Mesin cuci", "label": "Mesin Cuci Emas · harga", "unit": "Rp", "def": 60, "min": 0, "max": 1000000000, "step": 50000},
  {"key": "item.iron.time", "group": "Mesin & alat", "sub": "Setrika", "label": "Papan Setrika Biasa · waktu proses", "unit": "dtk", "def": 11, "min": 1, "max": 300, "step": 1},
  {"key": "item.iron_pro.time", "group": "Mesin & alat", "sub": "Setrika", "label": "Meja Setrika Uap · waktu proses", "unit": "dtk", "def": 14, "min": 1, "max": 300, "step": 1},
  {"key": "item.iron_ind.time", "group": "Mesin & alat", "sub": "Setrika", "label": "Mesin Setrika Rol Industri · waktu proses", "unit": "dtk", "def": 14, "min": 1, "max": 300, "step": 1},
  {"key": "item.garment.time", "group": "Mesin & alat", "sub": "Gantung", "label": "Rak Pakaian Gantung · waktu proses", "unit": "dtk", "def": 6, "min": 1, "max": 300, "step": 1},
  {"key": "item.sortbench.time", "group": "Mesin & alat", "sub": "Sortir", "label": "Meja Sortir & Noda · waktu proses", "unit": "dtk", "def": 4, "min": 1, "max": 300, "step": 1},
  {"key": "item.packtable.time", "group": "Mesin & alat", "sub": "Kemas", "label": "Meja Kemas & QC · waktu proses", "unit": "dtk", "def": 4, "min": 1, "max": 300, "step": 1},
  {"key": "item.shoebench.time", "group": "Mesin & alat", "sub": "Cuci sepatu", "label": "Meja Cuci Sepatu · waktu proses", "unit": "dtk", "def": 14, "min": 1, "max": 300, "step": 1},
  {"key": "item.fold.time", "group": "Mesin & alat", "sub": "Lipat", "label": "Meja Lipat Biasa · waktu proses", "unit": "dtk", "def": 5, "min": 1, "max": 300, "step": 1},
  {"key": "item.fold_pro.time", "group": "Mesin & alat", "sub": "Lipat", "label": "Meja Lipat Profesional · waktu proses", "unit": "dtk", "def": 7, "min": 1, "max": 300, "step": 1},
  {"key": "item.fold_ind.time", "group": "Mesin & alat", "sub": "Lipat", "label": "Stasiun Lipat Industri · waktu proses", "unit": "dtk", "def": 7, "min": 1, "max": 300, "step": 1},
  {"key": "svc.kering.perKg", "group": "Layanan", "sub": "Cuci Kering", "label": "Cuci Kering · harga dasar", "unit": "Rp/kg", "def": 7000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.kering.hours", "group": "Layanan", "sub": "Cuci Kering", "label": "Cuci Kering · janji selesai", "unit": "jam", "def": 12, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.setrika.perKg", "group": "Layanan", "sub": "Cuci Setrika", "label": "Cuci Setrika · harga dasar", "unit": "Rp/kg", "def": 10000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.setrika.hours", "group": "Layanan", "sub": "Cuci Setrika", "label": "Cuci Setrika · janji selesai", "unit": "jam", "def": 16, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.setrika_saja.perKg", "group": "Layanan", "sub": "Setrika Saja", "label": "Setrika Saja · harga dasar", "unit": "Rp/kg", "def": 6000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.setrika_saja.hours", "group": "Layanan", "sub": "Setrika Saja", "label": "Setrika Saja · janji selesai", "unit": "jam", "def": 4, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.express.perKg", "group": "Layanan", "sub": "Ekspres", "label": "Ekspres · harga dasar", "unit": "Rp/kg", "def": 18000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.express.hours", "group": "Layanan", "sub": "Ekspres", "label": "Ekspres · janji selesai", "unit": "jam", "def": 3.5, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.bedcover.perKg", "group": "Layanan", "sub": "Seprai, Bedcover & Selimut", "label": "Seprai, Bedcover & Selimut · harga dasar", "unit": "Rp/kg", "def": 15000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.bedcover.hours", "group": "Layanan", "sub": "Seprai, Bedcover & Selimut", "label": "Seprai, Bedcover & Selimut · janji selesai", "unit": "jam", "def": 10, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.satuan.perKg", "group": "Layanan", "sub": "Laundry Satuan", "label": "Laundry Satuan · harga dasar", "unit": "Rp/potong", "def": 12000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.satuan.hours", "group": "Layanan", "sub": "Laundry Satuan", "label": "Laundry Satuan · janji selesai", "unit": "jam", "def": 24, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.sepatu.perKg", "group": "Layanan", "sub": "Cuci Sepatu", "label": "Cuci Sepatu · harga dasar", "unit": "Rp/potong", "def": 40000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.sepatu.hours", "group": "Layanan", "sub": "Cuci Sepatu", "label": "Cuci Sepatu · janji selesai", "unit": "jam", "def": 24, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.dryclean.perKg", "group": "Layanan", "sub": "Cuci Kimia (Dry Clean)", "label": "Cuci Kimia (Dry Clean) · harga dasar", "unit": "Rp/potong", "def": 35000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.dryclean.hours", "group": "Layanan", "sub": "Cuci Kimia (Dry Clean)", "label": "Cuci Kimia (Dry Clean) · janji selesai", "unit": "jam", "def": 36, "min": 1, "max": 240, "step": 0.5},
  {"key": "svc.premium.perKg", "group": "Layanan", "sub": "Pakaian Premium (gaun, jas, kebaya)", "label": "Pakaian Premium (gaun, jas, kebaya) · harga dasar", "unit": "Rp/potong", "def": 75000, "min": 0, "max": 10000000, "step": 500},
  {"key": "svc.premium.hours", "group": "Layanan", "sub": "Pakaian Premium (gaun, jas, kebaya)", "label": "Pakaian Premium (gaun, jas, kebaya) · janji selesai", "unit": "jam", "def": 48, "min": 1, "max": 240, "step": 0.5},
  {"key": "need.hunger.decay", "group": "Karyawan", "sub": "Kebutuhan", "label": "Lapar · turun per jam", "unit": "poin/jam", "def": 5, "min": 0, "max": 50, "step": 0.5},
  {"key": "need.thirst.decay", "group": "Karyawan", "sub": "Kebutuhan", "label": "Haus · turun per jam", "unit": "poin/jam", "def": 6, "min": 0, "max": 50, "step": 0.5},
  {"key": "need.bladder.decay", "group": "Karyawan", "sub": "Kebutuhan", "label": "Toilet · turun per jam", "unit": "poin/jam", "def": 6, "min": 0, "max": 50, "step": 0.5},
  {"key": "need.energy.decay", "group": "Karyawan", "sub": "Kebutuhan", "label": "Lelah · turun per jam", "unit": "poin/jam", "def": 5, "min": 0, "max": 50, "step": 0.5},
  {"key": "need.hygiene.decay", "group": "Karyawan", "sub": "Kebutuhan", "label": "Kotor · turun per jam", "unit": "poin/jam", "def": 3, "min": 0, "max": 50, "step": 0.5},
  {"key": "staff.basic.wageHour", "group": "Karyawan", "sub": "Gaji", "label": "Staf Laundry · upah per jam", "unit": "Rp", "def": 8000, "min": 0, "max": 1000000, "step": 500},
  {"key": "staff.senior.wageHour", "group": "Karyawan", "sub": "Gaji", "label": "Staf Senior · upah per jam", "unit": "Rp", "def": 13000, "min": 0, "max": 1000000, "step": 500},
  {"key": "tierDemand.0", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Laundry Rumahan", "unit": "×", "def": 0.65, "min": 0, "max": 3, "step": 0.05},
  {"key": "tierDemand.1", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Laundry Kecil", "unit": "×", "def": 0.8, "min": 0, "max": 3, "step": 0.05},
  {"key": "tierDemand.2", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Laundry Profesional", "unit": "×", "def": 0.9, "min": 0, "max": 3, "step": 0.05},
  {"key": "tierDemand.3", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Laundry Unggulan", "unit": "×", "def": 1, "min": 0, "max": 3, "step": 0.05},
  {"key": "tierDemand.4", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Laundry Industri", "unit": "×", "def": 1, "min": 0, "max": 3, "step": 0.05},
  {"key": "tierDemand.5", "group": "Ekonomi", "sub": "Permintaan", "label": "Permintaan tier Korporasi Laundry", "unit": "×", "def": 1, "min": 0, "max": 3, "step": 0.05},
  {"key": "cfg.demandBase", "group": "Ekonomi", "sub": "Permintaan", "label": "Peluang pelanggan dasar per detik", "unit": "", "def": 0.05, "min": 0, "max": 1, "step": 0.005},
  {"key": "cfg.startCash", "group": "Ekonomi", "sub": "Modal & sewa", "label": "Modal awal", "unit": "Rp", "def": 5000000, "min": 0, "max": 10000000000, "step": 50000},
  {"key": "cfg.startGem", "group": "Ekonomi", "sub": "Modal & sewa", "label": "Diamond awal", "unit": "butir", "def": 20, "min": 0, "max": 10000000000, "step": 1},
  {"key": "cfg.rentBase", "group": "Ekonomi", "sub": "Modal & sewa", "label": "Sewa dasar per hari", "unit": "Rp", "def": 100000, "min": 0, "max": 10000000000, "step": 50000},
  {"key": "cfg.rentPerLot", "group": "Ekonomi", "sub": "Modal & sewa", "label": "Tambahan sewa per perluasan", "unit": "Rp", "def": 120000, "min": 0, "max": 10000000000, "step": 50000},
  {"key": "chem.det_basic.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Deterjen Basic · harga", "unit": "Rp/L", "def": 18000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.det_prem.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Deterjen Premium · harga", "unit": "Rp/L", "def": 42000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.det_konz.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Deterjen Konsentrat · harga", "unit": "Rp/L", "def": 62000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.det_halus.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Deterjen Kain Halus · harga", "unit": "Rp/L", "def": 78000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.det_sepatu.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Sabun Sepatu · harga", "unit": "Rp/L", "def": 52000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.det_ind.price", "group": "Bahan cuci", "sub": "Deterjen", "label": "Deterjen Industri · harga", "unit": "Rp/L", "def": 30000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pew_floral.price", "group": "Bahan cuci", "sub": "Pewangi", "label": "Pewangi Floral · harga", "unit": "Rp/L", "def": 22000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pew_fresh.price", "group": "Bahan cuci", "sub": "Pewangi", "label": "Pewangi Fresh · harga", "unit": "Rp/L", "def": 24000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pew_prem.price", "group": "Bahan cuci", "sub": "Pewangi", "label": "Pewangi Premium · harga", "unit": "Rp/L", "def": 68000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pew_hypo.price", "group": "Bahan cuci", "sub": "Pewangi", "label": "Pewangi Hipoalergenik · harga", "unit": "Rp/L", "def": 56000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pel_std.price", "group": "Bahan cuci", "sub": "Pelembut", "label": "Pelembut Standar · harga", "unit": "Rp/L", "def": 20000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pel_prem.price", "group": "Bahan cuci", "sub": "Pelembut", "label": "Pelembut Premium · harga", "unit": "Rp/L", "def": 48000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.pel_anti.price", "group": "Bahan cuci", "sub": "Pelembut", "label": "Pelembut Antistatis · harga", "unit": "Rp/L", "def": 40000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.noda_gen.price", "group": "Bahan cuci", "sub": "Penghilang noda", "label": "Penghilang Noda Umum · harga", "unit": "Rp/L", "def": 45000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.noda_heavy.price", "group": "Bahan cuci", "sub": "Penghilang noda", "label": "Penghilang Noda Berat · harga", "unit": "Rp/L", "def": 72000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.noda_del.price", "group": "Bahan cuci", "sub": "Penghilang noda", "label": "Penghilang Noda Kain Halus · harga", "unit": "Rp/L", "def": 82000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.san_std.price", "group": "Bahan cuci", "sub": "Disinfektan", "label": "Disinfektan Standar · harga", "unit": "Rp/L", "def": 35000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.san_prem.price", "group": "Bahan cuci", "sub": "Disinfektan", "label": "Disinfektan Premium · harga", "unit": "Rp/L", "def": 60000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.san_ind.price", "group": "Bahan cuci", "sub": "Disinfektan", "label": "Disinfektan Industri · harga", "unit": "Rp/L", "def": 28000, "min": 0, "max": 100000000, "step": 500},
  {"key": "chem.plastik.price", "group": "Bahan cuci", "sub": "Kemasan", "label": "Plastik Kemasan · harga", "unit": "Rp/lembar", "def": 300, "min": 0, "max": 100000000, "step": 500}
];

/* Terapkan nilai pengganti ke data game. values = {key: angka}. Kunci yang tidak dikenal diabaikan. */
window.JL_BALANCE_APPLY=function(values,T){let n=0;for(const [key,v] of Object.entries(values||{})){if(typeof v!=='number'||!isFinite(v))continue;const p=key.split('.');
  try{if(p[0]==='item'&&T.ITEMS[p[1]]){T.ITEMS[p[1]][p[2]]=v;n++}else if(p[0]==='svc'&&T.SERVICES[p[1]]){T.SERVICES[p[1]][p[2]]=v;n++}else if(p[0]==='need'&&T.NEEDS[p[1]]){T.NEEDS[p[1]][p[2]]=v;n++}
    else if(p[0]==='staff'&&T.STAFF[p[1]]){T.STAFF[p[1]][p[2]]=v;n++}else if(p[0]==='tierDemand'&&p[1] in T.TIER_DEMAND){T.TIER_DEMAND[+p[1]]=v;n++}else if(p[0]==='cfg'&&p[1] in T.CFG){T.CFG[p[1]]=v;n++}
    else if(p[0]==='chem'&&T.CHEM[p[1]]){T.CHEM[p[1]][p[2]]=v;n++}}catch(e){}}return n};

/* Editor keseimbangan bersama (admin.html & konsol pengelola di versi Claude).
   opt = {values, version, log, onSave(values, changes, note) -> Promise} */
window.JL_BALANCE_EDITOR=function(root,opt){
  const D=window.JL_BALANCE_DEFS,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  if(!document.getElementById('jlbal-css')){const st=document.createElement('style');st.id='jlbal-css';st.textContent=`
.jb{display:grid;gap:10px;font:14px/1.4 Nunito,system-ui,sans-serif;color:#142B4A}.jb *{box-sizing:border-box}
.jb-top{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.jb-top input{flex:1;min-width:180px;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font:inherit}
.jb-chips{display:flex;gap:6px;flex-wrap:wrap}.jb-chip{border:1px solid #dbe4f0;background:#fff;border-radius:999px;padding:5px 12px;font:700 13px Nunito,sans-serif;cursor:pointer;color:#142B4A}.jb-chip.on{background:#142B4A;color:#fff;border-color:#142B4A}.jb-chip small{opacity:.7;margin-left:4px}
.jb-sub{font:700 12px Nunito,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin:10px 0 4px}
.jb-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 120px 32px;gap:8px;align-items:center;border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;background:#fff;margin-bottom:4px}
.jb-row.ch{border-color:#2563EB;background:#eff6ff}.jb-row b{display:block;font-size:13px}.jb-row small{color:#64748b;font-size:11.5px}
.jb-row input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:6px 8px;font:700 13px Nunito,sans-serif;text-align:right}.jb-def{font-size:12px;color:#64748b;text-align:right}
.jb-x{border:0;background:#f1f5f9;border-radius:8px;height:30px;cursor:pointer;color:#475569}.jb-x:disabled{opacity:.3;cursor:default}
.jb-foot{position:sticky;bottom:0;background:#f8fafc;border:1px solid #dbe4f0;border-radius:14px;padding:10px 12px;display:grid;gap:8px}
.jb-foot textarea{width:100%;min-height:54px;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font:inherit}
.jb-diff{display:flex;flex-wrap:wrap;gap:6px}.jb-diff span{background:#fff;border:1px solid #dbe4f0;border-radius:999px;padding:3px 10px;font-size:12px}
.jb-btn{border:0;border-radius:10px;padding:9px 16px;font:800 14px Nunito,sans-serif;cursor:pointer;background:#2563EB;color:#fff}.jb-btn:disabled{opacity:.45;cursor:default}.jb-btn.sec{background:#eef3fb;color:#142B4A}
.jb-log{display:grid;gap:6px}.jb-v{border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;background:#fff}.jb-v b{font-size:13px}.jb-v small{color:#64748b}.jb-v ul{margin:4px 0 0;padding-left:18px;font-size:12.5px}
.jb-msg{font-size:13px;font-weight:700}.jb-msg.bad{color:#dc2626}.jb-msg.ok{color:#16a34a}
@media(max-width:640px){.jb-row{grid-template-columns:1fr 90px 32px}.jb-def{display:none}}`;document.head.appendChild(st)}
  const fmt=n=>{const a=Math.abs(n);return a>=1000?Math.round(n).toLocaleString('id-ID'):String(Math.round(n*1000)/1000).replace('.',',')};
  const st={grp:'Mesin & alat',q:'',draft:{...(opt.values||{})},busy:false,msg:'',bad:false};
  const groups=[...new Set(D.map(d=>d.group))];
  const val=k=>{const d=D.find(x=>x.key===k);return k in st.draft?st.draft[k]:d.def};
  const prev=k=>{const d=D.find(x=>x.key===k);return k in (opt.values||{})?opt.values[k]:d.def};
  const changes=()=>D.filter(d=>val(d.key)!==prev(d.key)).map(d=>({key:d.key,label:d.label,from:prev(d.key),to:val(d.key)}));
  function render(){const q=st.q.trim().toLowerCase(),list=D.filter(d=>q?(d.label+' '+d.sub+' '+d.key).toLowerCase().includes(q):d.group===st.grp),ch=changes();
    let html=`<div class="jb-top"><input type="search" placeholder="Cari parameter, mis. jemuran, deterjen, gaji…" value="${esc(st.q)}" data-q></div>
      <div class="jb-chips">${groups.map(g=>`<button class="jb-chip ${!q&&st.grp===g?'on':''}" data-g="${esc(g)}">${esc(g)}<small>${D.filter(d=>d.group===g).length}</small></button>`).join('')}</div><div>`;
    let sub='';for(const d of list){if(d.sub!==sub){sub=d.sub;html+=`<div class="jb-sub">${esc(q?d.group+' · '+sub:sub)}</div>`}
      const v=val(d.key),changed=v!==d.def;
      html+=`<div class="jb-row ${v!==prev(d.key)?'ch':''}"><div><b>${esc(d.label)}</b><small>${esc(d.unit||'')}${changed?' · diubah dari bawaan':''}</small></div><div class="jb-def">bawaan ${fmt(d.def)}</div><input type="number" step="${d.step}" min="${d.min}" max="${d.max}" value="${v}" data-k="${d.key}" aria-label="${esc(d.label)}"><button class="jb-x" data-r="${d.key}" title="Kembalikan ke bawaan" aria-label="Kembalikan ${esc(d.label)} ke bawaan" ${changed?'':'disabled'}>↺</button></div>`}
    html+=`</div><div class="jb-foot"><b>Versi aktif: v${opt.version||0} · ${ch.length} perubahan belum disimpan</b>${ch.length?`<div class="jb-diff">${ch.slice(0,12).map(c=>`<span>${esc(c.label)}: ${fmt(c.from)} → <b>${fmt(c.to)}</b></span>`).join('')}${ch.length>12?`<span>+${ch.length-12} lagi</span>`:''}</div>`:''}
      <textarea placeholder="Catatan untuk pemain, mis. Jemuran dipercepat agar hari pertama tidak rugi" data-note>${esc(st.note||'')}</textarea>
      <div class="jb-top"><button class="jb-btn" data-save ${ch.length&&!st.busy?'':'disabled'}>${st.busy?'Menyimpan…':'Terbitkan v'+((opt.version||0)+1)}</button><button class="jb-btn sec" data-reset ${ch.length?'':'disabled'}>Batalkan perubahan</button><span class="jb-msg ${st.bad?'bad':'ok'}">${esc(st.msg)}</span></div></div>
      <h3 style="margin:6px 0 0">Riwayat versi</h3><div class="jb-log">${(opt.log||[]).length?(opt.log||[]).map(l=>`<div class="jb-v"><b>v${l.version}</b> <small>${new Date(l.at).toLocaleString('id-ID')} · ${esc(l.by||'')}</small>${l.note?`<div>${esc(l.note)}</div>`:''}${l.changes&&l.changes.length?`<ul>${l.changes.map(c=>`<li>${esc(c.label)}: ${fmt(c.from)} → ${fmt(c.to)}</li>`).join('')}</ul>`:''}</div>`).join(''):'<small>Belum ada versi. Semua nilai masih bawaan.</small>'}</div>`;
    root.innerHTML=`<div class="jb">${html}</div>`;const qi=root.querySelector('[data-q]');if(st.focusQ){qi.focus();qi.setSelectionRange(qi.value.length,qi.value.length);st.focusQ=false}}
  root.addEventListener('input',e=>{const t=e.target;if(t.dataset.q!==undefined){st.q=t.value;st.focusQ=true;render()}
    else if(t.dataset.note!==undefined)st.note=t.value;
    else if(t.dataset.k){const v=parseFloat(t.value),d=D.find(x=>x.key===t.dataset.k);if(isFinite(v)){if(v===d.def)delete st.draft[d.key];else st.draft[d.key]=v}t.closest('.jb-row').classList.toggle('ch',val(d.key)!==prev(d.key))}});
  root.addEventListener('change',e=>{if(e.target.dataset.k)setTimeout(render,0)});
  root.addEventListener('click',async e=>{const t=e.target.closest('button');if(!t)return;
    if(t.dataset.g){st.grp=t.dataset.g;st.q='';render()}
    else if(t.dataset.r){delete st.draft[t.dataset.r];render()}
    else if(t.dataset.reset!==undefined){st.draft={...(opt.values||{})};st.msg='';render()}
    else if(t.dataset.save!==undefined){const ch=changes();if(!ch.length)return;st.busy=true;st.msg='';render();
      try{const out={};for(const [k,v] of Object.entries(st.draft))if(D.find(d=>d.key===k)&&v!==D.find(d=>d.key===k).def)out[k]=v;
        await opt.onSave(out,ch,st.note||'');st.note='';st.msg='Versi baru terbit. Pemain mendapatkannya saat membuka game.';st.bad=false;st.draft={...(opt.values||{})}}
      catch(err){st.msg=err&&err.message==='conflict'?'Ada admin lain yang menyimpan lebih dulu. Muat ulang halaman.':'Gagal menyimpan: '+((err&&err.message)||err);st.bad=true}
      st.busy=false;render()}});
  render();return{refresh:render}};
