import { generateId } from '../../common/generate-id';
import { ArticleStatus } from '../article-enum';
import {
  ArticleAlreadyPublishedException,
  ArticleNotEditableException,
} from '../article-exceptions';
import { ArticleTitle } from './article-title';

interface ArticleProps {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: ArticleStatus;
  createdAt: Date;
}

/**
 * Article 애그리거트 루트.
 * - 상태는 private, 변경은 규칙 메서드로만(공개 setter 금지 → 불변식 우회 차단).
 * - 규칙(if)은 여기에. command service엔 배선만.
 * - 다른 애그리거트(author)는 ID로만 참조한다(tactical-ddd.md).
 */
export class Article {
  private constructor(
    readonly id: string,
    readonly authorId: string,
    private _title: ArticleTitle,
    private _content: string,
    private _status: ArticleStatus,
    private readonly _createdAt: Date,
  ) {}

  /** 새 게시글 — 도메인이 ID 생성, 초기 상태 DRAFT (aggregate-id.md) */
  static create(authorId: string, title: string, content: string): Article {
    return new Article(
      generateId(),
      authorId,
      ArticleTitle.of(title),
      content,
      ArticleStatus.DRAFT,
      new Date(),
    );
  }

  /** DB 복원 — 기존 ID 유지 (repository 매퍼가 호출) */
  static restore(props: ArticleProps): Article {
    return new Article(
      props.id,
      props.authorId,
      ArticleTitle.of(props.title),
      props.content,
      props.status,
      props.createdAt,
    );
  }

  /** 발행 — DRAFT일 때만 (규칙 위반 시 도메인 예외 throw) */
  publish(): void {
    if (this._status !== ArticleStatus.DRAFT) throw new ArticleAlreadyPublishedException();
    this._status = ArticleStatus.PUBLISHED;
  }

  /** 수정 — DRAFT일 때만 (발행 후 잠금) */
  edit(title: string, content: string): void {
    if (this._status !== ArticleStatus.DRAFT) throw new ArticleNotEditableException();
    this._title = ArticleTitle.of(title);
    this._content = content;
  }

  get title(): string {
    return this._title.value;
  }

  get content(): string {
    return this._content;
  }

  get status(): ArticleStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
