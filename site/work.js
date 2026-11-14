/* The work section. Default is version C: the frosted-glass grid with the blur hover
   (from the pop build) and the horizontal-scroll project pages (from the flight build).
   ?work=a or ?work=b loads the two reference-led versions for comparison. */
const q = new URLSearchParams(location.search).get('work');
const v = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].includes(q) ? q : 'g';
import(`./work-${v}.js`);
