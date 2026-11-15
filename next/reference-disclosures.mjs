// Native details remain keyboard-operable; adapt only when crossing the breakpoint.
const compact=matchMedia('(max-width:700px)');
function adapt(){for(const details of document.querySelectorAll('.responsive-disclosure'))details.open=!compact.matches;}
adapt();compact.addEventListener('change',adapt);
