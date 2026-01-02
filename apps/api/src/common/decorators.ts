import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user);
