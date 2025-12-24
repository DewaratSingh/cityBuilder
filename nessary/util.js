function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}
function rectRectCollision(A, B) {
  const axes = [
    { x: Math.cos(A.angle), y: Math.sin(A.angle) },
    { x: -Math.sin(A.angle), y: Math.cos(A.angle) },
    { x: Math.cos(B.angle), y: Math.sin(B.angle) },
    { x: -Math.sin(B.angle), y: Math.cos(B.angle) },
  ];

  const hwA = A.width / 2;
  const hhA = A.height / 2;
  const hwB = B.width / 2;
  const hhB = B.height / 2;

  const ax = A.position ? A.position.x : A.x;
  const ay = A.position ? A.position.y : A.y;

  const bx = B.position ? B.position.x : B.x;
  const by = B.position ? B.position.y : B.y;

  const dx = bx - ax;
  const dy = by - ay;

  for (let axis of axes) {
    const dist = Math.abs(dx * axis.x + dy * axis.y);

    const projA =
      hwA * Math.abs(axis.x * Math.cos(A.angle) + axis.y * Math.sin(A.angle)) +
      hhA * Math.abs(axis.x * -Math.sin(A.angle) + axis.y * Math.cos(A.angle));

    const projB =
      hwB * Math.abs(axis.x * Math.cos(B.angle) + axis.y * Math.sin(B.angle)) +
      hhB * Math.abs(axis.x * -Math.sin(B.angle) + axis.y * Math.cos(B.angle));

    if (dist > projA + projB) {
      return false;
    }
  }

  return true;
}
