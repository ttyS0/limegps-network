export function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function(e) {
      let result = e.target.result;
      resolve(result);
    };
    reader.onerror = function(e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}