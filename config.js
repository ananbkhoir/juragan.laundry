/* Konfigurasi versi host sendiri. Biarkan kosong untuk mode artifact Claude.
   Isi ketiganya agar game wajib login Google dan memakai backend sendiri. Lihat docs/HOSTING-GOOGLE.md */
window.JL_CONFIG = {
  backendUrl: 'https://juragan-laundry-api.juraganlaundry.workers.dev',        // mis. 'https://juragan-laundry-api.namamu.workers.dev'
  googleClientId: '992175212524-ac4q6js15a0t6o40gnrgrfpe3fj89grm.apps.googleusercontent.com',    // mis. '1234567890-abc.apps.googleusercontent.com'
  saweriaUser: 'kimgamingofficial',       // username saweria.co milikmu
  admins: ['ananbkhoir@gmail.com', 'anan.lemhannas.2025@gmail.com']             // HANYA mengatur tampilan menu Admin; otorisasi asli ada di secret ADMIN_SUBS/ADMIN_EMAILS di Worker
};
