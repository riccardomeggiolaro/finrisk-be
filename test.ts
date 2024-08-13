/* eslint-disable prettier/prettier */
const eventSource = new EventSource('http://localhost:3000/api/drive/upload');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log(`Current progress: ${data.progress}%`);
  // Puoi aggiornare la UI con la nuova percentuale di progresso
};

eventSource.addEventListener('complete', function(event) {
  const data = JSON.parse(event.data);
  console.log(data.message);
  eventSource.close();
});

eventSource.onerror = function(err) {
  console.error('EventSource failed:', err);
};