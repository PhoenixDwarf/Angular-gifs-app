import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment.development';
import type { GiphyResponse } from '../interfaces/giphy.interfaces';
import { Gif } from '../interfaces/gif.interface';
import { GifMapper } from '../mapper/gif.mapper';
import { map, tap } from 'rxjs';

const loadFromLocaleStorage = () => {
  const gifsFromLocaleStorage = localStorage.getItem('gifsHistory') ?? '{}';
  const gifs = JSON.parse(gifsFromLocaleStorage);
  return gifs;
};

@Injectable({
  providedIn: 'root',
})
export class GifService {
  private readonly http = inject(HttpClient);

  trendingGifs = signal<Gif[]>([]);
  trendingGifsLoading = signal(false);
  private readonly trendingPage = signal(0);

  trendingGifGroup = computed<Gif[][]>(() => {
    const groups = [];
    for (let i = 0; i < this.trendingGifs().length; i += 3) {
      groups.push(this.trendingGifs().slice(i, i + 3));
    }
    console.log(groups);
    return groups;
  });

  searchHistory = signal<Record<string, Gif[]>>(loadFromLocaleStorage());
  searchHistoryKeys = computed(() => Object.keys(this.searchHistory()));

  saveGifsToLocaleStorage = effect(() => {
    const historyString = JSON.stringify(this.searchHistory());
    localStorage.setItem('gifsHistory', historyString);
  });

  constructor() {
    this.loadTrendingGifs();
  }

  loadTrendingGifs() {
    if (this.trendingGifsLoading()) return;
    this.trendingGifsLoading.set(true);
    this.http
      .get<GiphyResponse>(`${environment.giphyUrl}/gifs/trending`, {
        params: {
          api_key: environment.giphyApiKey,
          limit: 20,
          offset: this.trendingPage() * 20,
        },
      })
      .subscribe({
        next: (res) => {
          const gifs = GifMapper.mapGiphyItemsToGifArray(res.data);
          this.trendingGifs.update((prevGifs) => [...prevGifs, ...gifs]);
          this.trendingPage.update((val) => val + 1);
          this.trendingGifsLoading.set(false);
        },
      });
  }

  searchGifs(query: string) {
    return this.http
      .get<GiphyResponse>(`${environment.giphyUrl}/gifs/search`, {
        params: {
          api_key: environment.giphyApiKey,
          limit: 20,
          q: query,
        },
      })
      .pipe(
        map((res) => GifMapper.mapGiphyItemsToGifArray(res.data)),
        tap((items) => {
          this.searchHistory.update((history) => ({
            ...history,
            [query.toLowerCase()]: items,
          }));
        })
      );
  }

  getHistoryGifs(query: string) {
    return this.searchHistory()[query] ?? [];
  }
}
