import { ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal } from '@angular/core';
import { ApiService, Currency, CurrencyTranslations } from "../api.service";
import { NgForOf } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { debounceTime, switchMap, take } from "rxjs";

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

  leftAmount = signal(1);
  rightAmount = signal(0);
  conversionRate = computed(() => `${this.leftAmount()} ${CurrencyTranslations[this.currencyLeft.getRawValue().type!]} = ${this.rightAmount()} ${CurrencyTranslations[this.currencyRight.getRawValue().type!]}`);

  public availableCurrencies: Currency[] = [Currency.USD, Currency.EUR, Currency.GBP, Currency.RUB, Currency.AMD, Currency.AED];
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
    this.api.getRatesForCurrency().pipe(take(1)).subscribe(rates => {
      this.currencyRight.setValue({
        value: rates[Currency.RUB],
        type: Currency.RUB
      }, {emitEvent: false});
      this.currencyLeft.setValue({
        value: 1,
        type: Currency.USD
      }, {emitEvent: false});
      this.rightAmount.set(rates[Currency.RUB]);
    });

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
        this.currencyRight.get('value')?.setValue(<number><unknown>((currencyLeft.value ?? 0) * rates[currencyRight.type!]).toFixed(6), {emitEvent: false});
        this.rightAmount.set(this.currencyRight.getRawValue().value!);
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
        this.currencyLeft.get('value')?.setValue(<number><unknown>((currencyRight.value ?? 0) * rates[currencyLeft.type!]).toFixed(6), {emitEvent: false});
        this.leftAmount.set(this.currencyLeft.getRawValue().value!);
      });
  }

  switchCurrencies(): void {
    const leftCurrency = this.currencyLeft.getRawValue();
    this.currencyLeft.patchValue({type: this.currencyRight.getRawValue().type});
    this.currencyRight.patchValue({type: leftCurrency.type}, {emitEvent: false});
  }
}
