
export default async function Until(predicate) {
  const poll = (resolve) => {
    if (predicate()) {
      resolve();
    } else {
      setTimeout(() => poll(resolve), 100);
    }
  };
  return new Promise(poll);
}
