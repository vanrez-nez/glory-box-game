
export default async function Until(predicate: any) {
  const poll = (resolve: any) => {
    if (predicate()) {
      resolve();
    } else {
      setTimeout(() => poll(resolve), 100);
    }
  };
  return new Promise(poll);
}
