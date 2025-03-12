import { Range } from "./type";

export function createQuery(): SearchQuery {
    return new SearchQuery();
}

export class SearchQuery {
    
    private query: string = "";

    constructor() {}

    get queryString(): string {
        return this.query;
    }

    all(): SearchQuery {
        this.query += "ALL ";
        return this;
    }

    answered(): SearchQuery {
        this.query += "ANSWERED ";
        return this;
    }

    deleted(): SearchQuery {
        this.query += "DELETED ";
        return this;
    }

    flagged(): SearchQuery {
        this.query += "FLAGGED ";
        return this;
    }

    seen(): SearchQuery {
        this.query += "SEEN ";
        return this;
    }

    unseen(): SearchQuery {
        this.query += "UNSEEN ";
        return this;
    }

    draft(): SearchQuery {
        this.query += "DRAFT ";
        return this;
    }

    recent(): SearchQuery {
        this.query += "RECENT ";
        return this;
    }

    before(date: string): SearchQuery {
        this.query += `BEFORE ${date} `;
        return this;
    }

    since(date: string): SearchQuery {
        this.query += `SINCE ${date} `;
        return this;
    }

    on(date: string): SearchQuery {
        this.query += `ON ${date} `;
        return this;
    }

    from(email: string): SearchQuery {
        this.query += `FROM ${email} `;
        return this;
    }

    to(email: string): SearchQuery {
        this.query += `TO ${email} `;
        return this;
    }

    text(text: string): SearchQuery {
        this.query += `TEXT ${text} `;
        return this;
    }

    body(text: string): SearchQuery {
        this.query += `BODY ${text} `;
        return this;
    }

    keyword(text: string): SearchQuery {
        this.query += `KEYWORD ${text} `;
        return this;
    }

    header(text: string): SearchQuery {
        this.query += `HEADER ${text} `;
        return this;
    }

    subQuery(query: SearchQuery): SearchQuery {
        this.query += `(${query.queryString}) `;
        return this;
    }

    and(query: SearchQuery): SearchQuery {
        this.query += `AND ${query.queryString} `;
        return this;
    }

    or(query: SearchQuery): SearchQuery {
        this.query += `OR ${query.queryString} `;
        return this;
    }

    not(query: SearchQuery): SearchQuery {
        this.query += `NOT ${query.queryString} `;
        return this;
    }

    range(range: Range): SearchQuery {
        this.query += `${range} `;
        return this;
    }
}