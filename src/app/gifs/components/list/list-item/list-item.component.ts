import { Component, input } from '@angular/core';

@Component({
  selector: 'gifs-list-item',
  imports: [],
  templateUrl: './list-item.component.html',
})
export class ListItemComponent {
  url = input.required<string>();
}
