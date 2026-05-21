const maxConcurrent = Math.max(
  1,
  Number.parseInt(process.env.OCR_MAX_CONCURRENT || "2", 10) || 2,
);

let active = 0;
const queue = [];

const runNext = () => {
  if (active >= maxConcurrent || queue.length === 0) {
    return;
  }

  const { task, resolve, reject } = queue.shift();
  active += 1;

  Promise.resolve()
    .then(task)
    .then(resolve, reject)
    .finally(() => {
      active -= 1;
      runNext();
    });
};

export const withOcrSlot = (task) =>
  new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    runNext();
  });

export default { withOcrSlot };
