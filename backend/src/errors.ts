// 오류 핸들러가 status와 message로 응답을 만드는 HTTP 오류
export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// 400: 필드별 검증 실패 사유를 함께 내려준다
export class ValidationError extends HttpError {
  errors: { field: string; reason: string }[]

  constructor(errors: { field: string; reason: string }[]) {
    super(400, '입력값을 확인하세요')
    this.errors = errors
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = '인증이 필요합니다') {
    super(401, message)
  }
}

export class NotFoundError extends HttpError {
  constructor() {
    super(404, '찾을 수 없습니다')
  }
}
