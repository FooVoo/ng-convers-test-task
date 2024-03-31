import { ChangeDetectionStrategy, Component, DestroyRef, OnInit } from '@angular/core';
import { ApiService, Currency } from "../api.service";
import { NgForOf } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, switchMap } from "rxjs";

@Component({
  selector: 'app-convers',
  standalone: true,
  templateUrl: './conversion.component.html',
  imports: [
    NgForOf,
    ReactiveFormsModule
  ],
  styleUrl: './conversion.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConversionComponent implements OnInit {

  public availableCurrencies: Currency[] = [Currency.USD, Currency.EUR, Currency.GBP, Currency.RUB];
  public currencyLeft = new FormGroup({
    type: new FormControl<Currency>(Currency.USD, [Validators.required]),
    value: new FormControl<number>(0, [Validators.min(0)]),
  });
  public currencyRight = new FormGroup({
    type: new FormControl<Currency>(Currency.USD, [Validators.required]),
    value: new FormControl<number>(0, [Validators.min(0)]),
  });

  constructor(public api: ApiService, private destroyRef: DestroyRef) {
  }

  ngOnInit() {
    this.currencyLeft.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(({type}) => {
          return this.api.getRatesForCurrency(type!)
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rates) => {
        const currencyLeft = this.currencyLeft.getRawValue();
        const currencyRight = this.currencyRight.getRawValue();
        this.currencyRight.get('value')?.setValue(<number><unknown>((currencyLeft.value ?? 0) * rates[currencyRight.type!]).toFixed(2), {emitEvent: false});
      });
    this.currencyRight.valueChanges
      .pipe(
        debounceTime(300),
        switchMap(({type}) => {
          return this.api.getRatesForCurrency(type!)
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((rates) => {
        const currencyLeft = this.currencyLeft.getRawValue();
        const currencyRight = this.currencyRight.getRawValue();
        this.currencyLeft.get('value')?.setValue(<number><unknown>((currencyRight.value ?? 0) * rates[currencyLeft.type!]).toFixed(2), {emitEvent: false});
      });
  }
}
