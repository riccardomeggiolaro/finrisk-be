// import { File } from "@nest-lab/fastify-multer";
// import { Observable, Observer } from "rxjs";
// import { Readable } from "stream";

// /* eslint-disable prettier/prettier */
// class AdaptiveUploader {
//   async upload(file: File): Promise<Observable<number>> {
//     return new Observable<number>((observer: Observer<number>) => {
//         const MIN_CHUNK_SIZE = 256 * 1024; // 256 KB
//         const MAX_CHUNK_SIZE = 100 * 1024 * 1024; // 100 MB
//         const INITIAL_CHUNK_SIZE = 1 * 1024 * 1024; // 1 MB
//         const TARGET_UPLOAD_TIME = 5000; // Target upload time in milliseconds (5 seconds)
//         const ADJUSTMENT_FACTOR = 1.5; // Factor to increase/decrease chunk size

//         const calculateNextChunkSize = (lastChunkSize: number, lastUploadTime: number): number => {
//             const nextChunkSize = lastUploadTime < TARGET_UPLOAD_TIME
//                 ? lastChunkSize * ADJUSTMENT_FACTOR
//                 : lastChunkSize / ADJUSTMENT_FACTOR;
//             return Math.min(Math.max(nextChunkSize, MIN_CHUNK_SIZE), MAX_CHUNK_SIZE);
//         };

//         this.authorize().then(drive => {
//           const fileSize = file.size;
//           let chunkSize = INITIAL_CHUNK_SIZE;
//           let start = 0;
//           let uploadedBytes = 0;

//           drive.files.create({
//               requestBody: {
//                   name: file.originalname,
//                   parents: [this.FOLDER_ID],
//               },
//               media: {
//                   mimeType: file.mimetype,
//               },
//               fields: 'id',
//           }).then(res => {
//               const fileId = res.data.id;

//               const uploadChunk = () => {
//                   if (start < fileSize) {
//                       const end = Math.min(start + chunkSize, fileSize);
//                       const chunk = file.buffer.slice(start, end);
//                       const chunkStream = new Readable();
//                       chunkStream.push(chunk);
//                       chunkStream.push(null);

//                       const uploadStartTime = Date.now();

//                       drive.files.update({
//                           fileId: fileId,
//                           media: {
//                               body: chunkStream,
//                           },
//                           addParents: this.FOLDER_ID,
//                       }, {
//                           headers: {
//                               'Content-Range': `bytes ${start}-${end - 1}/${fileSize}`,
//                           },
//                       }).then(() => {
//                           const uploadEndTime = Date.now();
//                           const uploadTime = uploadEndTime - uploadStartTime;

//                           uploadedBytes += (end - start);
//                           const progress = (uploadedBytes / fileSize) * 100;
//                           observer.next(progress);

//                           start = end;
//                           // Calculate next chunk size based on the upload time of the current chunk
//                           chunkSize = calculateNextChunkSize(chunkSize, uploadTime);
//                           uploadChunk();
//                       }).catch(error => {
//                           observer.error(error);
//                       });
//                   } else {
//                       observer.complete();
//                   }
//               };

//               uploadChunk();
//           }).catch(error => {
//               observer.error(error);
//           });
//       }).catch(error => {
//           observer.error(error);
//       });
//     });
//   }      
// }