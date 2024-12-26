import { Component } from '@angular/core';

@Component({
  selector: 'app-question',
  imports: [],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent {
  question = {
    text: 'What is the capital of France?',
    image: 'assets/images/france-map.png', // Replace with your image path
  };
}
