
export const calculateParticipantsPerGroupArray = (pn: number, gn: number): number[] => {
  if (pn / gn < 3) throw new Error(`parts number: ${pn} and groups: ${gn}`)
  let out: number[] = [];

  const divUp = Math.ceil(pn / gn);
  const divDown = Math.floor(pn / gn);
  console.log('div up', divUp);
  console.log('div down', divDown);

  let total = pn;
  if (divDown !== divUp) {
    if (divUp % 2 !== 0) throw new Error(`no puede haber gr de ${divUp} y de ${divDown} en un mismo stagegroup`)
    total = total - divUp;
    out.push(divUp);
    while (total % divDown !== 0) {
      total = total - divUp;
      out.push(divUp);
    }
  }
  while (total !== 0) {
    total = total - divDown;
    out.push(divDown);
  }

  console.log(out);

  return out;
}