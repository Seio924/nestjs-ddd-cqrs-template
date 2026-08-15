import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AuthUnauthorizedException } from '../../common/exceptions/common-exceptions';
import { ApiErrors } from '../../common/decorators/api-error.decorator';
import { ApiResult, ApiResultList } from '../../common/decorators/api-result.decorator';
import {
  ArticleAlreadyPublishedException,
  ArticleNotEditableException,
  ArticleNotFoundException,
  InvalidArticleTitleException,
} from '../article-exceptions';
import { ArticleListItemBody } from './dto/list-articles-response-body';
import { ArticleResponseBody } from './dto/article-response-body';
import { CreateArticleRequestBody } from './dto/create-article-request-body';
import { CreateArticleResponseBody } from './dto/create-article-response-body';
import { UpdateArticleRequestBody } from './dto/update-article-request-body';

/**
 * 스웨거 8요소를 엔드포인트당 데코레이터 하나로 묶어 컨트롤러에서 분리(api-docs.md).
 * 문서는 interface 레이어 안에, 흐름은 컨트롤러에.
 */
export const CreateArticleDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ operationId: 'createArticle', summary: '게시글 작성' }),
    ApiBody({ type: CreateArticleRequestBody }),
    ApiResult(CreateArticleResponseBody),
    ApiErrors(AuthUnauthorizedException, InvalidArticleTitleException),
  );

export const ListArticlesDocs = () =>
  applyDecorators(
    ApiOperation({ operationId: 'listArticles', summary: '게시글 목록(오프셋)' }),
    ApiResultList('articles', ArticleListItemBody),
  );

export const GetArticleDocs = () =>
  applyDecorators(
    ApiOperation({ operationId: 'getArticle', summary: '게시글 단건 조회' }),
    ApiResult(ArticleResponseBody),
    ApiErrors(ArticleNotFoundException),
  );

export const UpdateArticleDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ operationId: 'updateArticle', summary: '게시글 수정(DRAFT만)' }),
    ApiBody({ type: UpdateArticleRequestBody }),
    ApiErrors(AuthUnauthorizedException, ArticleNotFoundException, ArticleNotEditableException),
  );

export const PublishArticleDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ operationId: 'publishArticle', summary: '게시글 발행' }),
    ApiErrors(
      AuthUnauthorizedException,
      ArticleNotFoundException,
      ArticleAlreadyPublishedException,
    ),
  );

export const DeleteArticleDocs = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ operationId: 'deleteArticle', summary: '게시글 삭제(soft)' }),
    ApiErrors(AuthUnauthorizedException, ArticleNotFoundException),
  );
