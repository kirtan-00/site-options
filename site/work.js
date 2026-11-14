/* The work section. Default is version C: the frosted-glass grid with the blur hover
   (from the pop build) and the horizontal-scroll project pages (from the flight build).
   ?work=a or ?work=b loads the two reference-led versions for comparison. */
const q = new URLSearchParams(location.search).get('work');
const v = q === 'a' || q === 'b' ? q : 'c';
import(`./work-${v}.js`);
