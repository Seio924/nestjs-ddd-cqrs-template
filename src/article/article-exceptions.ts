import { BaseException } from '../common/exceptions/base-exception';
import { ArticleErrorCode } from './article-error-code';
import { ArticleErrorMessage } from './article-error-message';

/** 도메인당 예외를 한 파일에 모은다(파일 폭발 방지). 각자 code·status·message 보유 → 전역 필터가 변환. */
export class ArticleNotFoundException extends BaseException {
  readonly code = ArticleErrorCode.NOT_FOUND;
  readonly status = 404;
  constructor() {
    super(ArticleErrorMessage.NOT_FOUND);
  }
}

export class ArticleAlreadyPublishedException extends BaseException {
  readonly code = ArticleErrorCode.ALREADY_PUBLISHED;
  readonly status = 409;
  constructor() {
    super(ArticleErrorMessage.ALREADY_PUBLISHED);
  }
}

export class ArticleNotEditableException extends BaseException {
  readonly code = ArticleErrorCode.NOT_EDITABLE;
  readonly status = 409;
  constructor() {
    super(ArticleErrorMessage.NOT_EDITABLE);
  }
}

export class InvalidArticleTitleException extends BaseException {
  readonly code = ArticleErrorCode.INVALID_TITLE;
  readonly status = 400;
  constructor() {
    super(ArticleErrorMessage.INVALID_TITLE);
  }
}
