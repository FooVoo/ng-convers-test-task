import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { map, Observable, of } from "rxjs";

export enum Currency {
  USD = 'USD',
  RUB = 'RUB',
  EUR = 'EUR',
  GBP = 'GBP'
}

// API RESULT EXAMPLE
//   "result": "success",
//   "documentation": "https://www.exchangerate-api.com/docs",
//   "terms_of_use": "https://www.exchangerate-api.com/terms",
//   "time_last_update_unix": 1711843201,
//   "time_last_update_utc": "Sun, 31 Mar 2024 00:00:01 +0000",
//   "time_next_update_unix": 1711929601,
//   "time_next_update_utc": "Mon, 01 Apr 2024 00:00:01 +0000",
//   "base_code": "USD",
//   "conversion_rates": { "USD": 1, ...}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private _cache: Map<string, any> = new Map();

  constructor(
    private http: HttpClient
  ) {
  }

  getRatesForCurrency(currency: Currency = Currency.USD): Observable<{ [p: string]: number }> {
    // 1500 calls a month! CARE PLZ
    if (this._cache.has(currency)) {
      return of(this._cache.get(currency));
    }
    return this.http.get(`https://v6.exchangerate-api.com/v6/671f067a57a4539c02513284/latest/${currency}`).pipe(
      map((response: any) => {
        this._cache.set(currency, response['conversion_rates']);
        return response['conversion_rates'] as { [key: string]: number };
      }),
    );
  }
}
