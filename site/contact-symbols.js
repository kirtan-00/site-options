/* Contact panel symbols: sun, chai, moon. No network, no images, no timers of its own.
   Sunrise 6-8, morning 8-12, noon 12-17, chai 17-18 (four stages), sunset 18-19, moon 19-6.
   The moon is worked out from the date with a short astronomy formula, so it is right for any night of any year. */
(() => {
  const R = Math.PI / 180, s = x => Math.sin(x * R), wrap = x => ((x % 360) + 360) % 360;
  /* how far round its cycle the moon is: 0 new, .5 full */
  const moonAge = date => {
    const d = date.getTime() / 864e5 + 2440587.5 - 2451545;
    const M = 357.529 + .98560028 * d, L = 280.459 + .98564736 * d;
    const Lm = 218.316 + 13.176396 * d, Mm = 134.963 + 13.064993 * d, F = 93.272 + 13.22935 * d, D = 297.85 + 12.190749 * d;
    const sun = L + 1.915 * s(M) + .02 * s(2 * M);
    const moon = Lm + 6.289 * s(Mm) - 1.274 * s(Mm - 2 * D) + .658 * s(2 * D) + .214 * s(2 * Mm) - .186 * s(M) - .114 * s(2 * F);
    return wrap(moon - sun) / 360;
  };
  /* the lit part: an outer half circle closed by an ellipse */
  const litPath = a => {
    const rx = (10 * Math.abs(Math.cos(a * 2 * Math.PI))).toFixed(2), wax = a < .5, fat = a > .25 && a < .75;
    return `M12 2A10 10 0 0 ${wax ? 1 : 0} 12 22A${rx} 10 0 0 ${wax === fat ? 1 : 0} 12 2Z`;
  };
  const moonName = a => ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'][Math.floor(a * 8 + .5) % 8];
  const moon = date => {
    const a = moonAge(date), lit = Math.round((1 - Math.cos(a * 2 * Math.PI)) / 2 * 100), name = moonName(a);
    return { label: name, line: `${name}. ${lit}% lit tonight.`, motion: 'none',
      svg: `<circle class="s" cx="12" cy="12" r="10" opacity=".3"/><path class="p ml" data-age="${a.toFixed(4)}" d="${litPath(a)}"/>` };
  };
  const rays = (n, len) => '<g class="a">' + Array.from({ length: n }, (_, i) => `<rect class="s" x="10.7" y="0" width="2.6" height="${len}" rx="1.3" transform="rotate(${i * 360 / n} 12 12)"/>`).join('') + '</g>';
  const SUN = {
    rise: { label: 'Sunrise', line: 'The sun, on time again. Show-off.', motion: 'bob', svg: '<g class="a"><path class="p" d="M5 17.4a7 7 0 0 1 14 0Z"/><rect class="s" x="10.8" y="4" width="2.4" height="3.6" rx="1.2"/><rect class="s" x="3.4" y="8" width="2.4" height="3.6" rx="1.2" transform="rotate(-45 4.6 9.8)"/><rect class="s" x="18.2" y="8" width="2.4" height="3.6" rx="1.2" transform="rotate(45 19.4 9.8)"/></g><rect class="s" x="1" y="19" width="22" height="2.6" rx="1.3"/>' },
    morning: { label: 'Morning', line: 'Good light. Wasted on meetings.', motion: 'spin', svg: '<circle class="p" cx="12" cy="12" r="5"/>' + rays(8, 3.2) },
    noon: { label: 'Afternoon', line: 'Harshest light of the day.', motion: 'spin', svg: '<circle class="p" cx="12" cy="12" r="6.4"/>' + rays(8, 4.2) },
    set: { label: 'Sunset', line: 'Golden hour. Everyone is a filmmaker now.', motion: 'bob', svg: '<g class="a"><path class="p" d="M4 16.6a8 8 0 0 1 16 0Z"/></g><rect class="s" x="1" y="18" width="22" height="2.4" rx="1.2"/><rect class="s" x="6" y="21.6" width="12" height="2" rx="1"/>' },
  };
  const steam = '<path class="st a" d="M9.6 6.6c-1.3-1.2 1.3-2.2 0-3.9"/><path class="st a" d="M14.4 6.6c-1.3-1.2 1.3-2.2 0-3.9"/>';
  const cup = y => { const k = (y - 12.4) * .126; return `<path class="s" d="M4.6 9H19.4L17.75 20.95A1.6 1.6 0 0 1 16.17 22.3H7.83A1.6 1.6 0 0 1 6.25 20.95Z"/><path class="p" d="M${(6.15 + k).toFixed(2)} ${y}H${(17.85 - k).toFixed(2)}L16.95 19.55A1.1 1.1 0 0 1 15.86 20.5H8.14A1.1 1.1 0 0 1 7.05 19.55Z"/>`; };
  const CHAI = [
    { label: 'Pouring chai', line: 'Chai is being poured. Please hold.', motion: 'bob', svg: cup(15.6) + '<path class="st a" d="M12 1.6V10"/>' },
    { label: 'Chai time', line: 'Full glass. Best meeting of the day.', motion: 'steam', svg: cup(12.4) + steam },
    { label: 'Half a chai', line: 'Half a glass. Full opinion.', motion: 'steam', svg: cup(15.6) + steam },
    { label: 'Last sip', line: 'Last sip. Treat it with respect.', motion: 'steam', svg: cup(18.4) + '<path class="st a" d="M12 6.6c-1.3-1.2 1.3-2.2 0-3.9"/>' },
  ];
  const pick = (date, h, min) => h < 6 || h >= 19 ? moon(date) : h < 8 ? SUN.rise : h < 12 ? SUN.morning : h < 17 ? SUN.noon : h === 17 ? CHAI[Math.floor(min / 15)] : SUN.set;
  /* when the panel opens the moon runs from new to tonight's shape once, about a second, then nothing runs */
  pick.sweep = root => {
    const p = root.querySelector('.ml');
    if (!p || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const end = +p.dataset.age, t0 = performance.now();
    const step = t => {
      if (!p.isConnected) return;
      const x = Math.min(1, (t - t0) / 1100);
      p.setAttribute('d', litPath(Math.max(.002, end * (1 - Math.pow(1 - x, 3)))));
      if (x < 1) requestAnimationFrame(step); else p.setAttribute('d', litPath(end));
    };
    requestAnimationFrame(step);
  };
  pick.age = moonAge;
  window.KP_SYMBOL = pick;
})();
