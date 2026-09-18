// Squared distance from a point to a finite line segment. Keeping this scalar
// avoids square roots and allocations in the projectile hot path.
export function pointSegmentDistanceSq(px,py,ax,ay,bx,by){
  const abx=bx-ax,aby=by-ay,lengthSq=abx*abx+aby*aby;
  if(lengthSq<=Number.EPSILON){const dx=px-ax,dy=py-ay;return dx*dx+dy*dy}
  const t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/lengthSq));
  const dx=px-(ax+abx*t),dy=py-(ay+aby*t);
  return dx*dx+dy*dy;
}

export function capsuleCircleOverlap(ax,ay,bx,by,cx,cy,radius){
  return pointSegmentDistanceSq(cx,cy,ax,ay,bx,by)<=radius*radius;
}
