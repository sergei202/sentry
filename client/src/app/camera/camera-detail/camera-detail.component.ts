import { Component, OnInit, Input } from '@angular/core';

@Component({
	selector: 'camera-detail',
	templateUrl: './camera-detail.component.html',
	styleUrls: ['./camera-detail.component.scss']
})
export class CameraDetailComponent implements OnInit {
	@Input() camera;

	constructor() { }

	ngOnInit() {
	}

}
