<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| SIPEGAS — SPA Catch-all
| Semua request non-API dilayani oleh React SPA.
|--------------------------------------------------------------------------
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

