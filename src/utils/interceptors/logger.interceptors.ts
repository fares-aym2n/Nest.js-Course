// import {
//   CallHandler,
//   ExecutionContext,
//   Injectable,
//   NestInterceptor,
// } from '@nestjs/common';
// import { map, Observable, tap } from 'rxjs';

// @Injectable()
// export class LoggerInterceptors implements NestInterceptor {
//   intercept(
//     context: ExecutionContext,
//     next: CallHandler<any>,
//   ): Observable<any> | Promise<Observable<any>> {
//     console.log('Before Handeler');
//     return next.handle().pipe(
//       map((data) => {
//         const { password, ...other } = data;
//         return { ...other };
//       }),
//     );
//   }
// }
