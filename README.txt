-----------------------
# README
-----------------------

MustACHE

						{% for name in names %}
						<div class="col-md-3 dataset">
								<div class="panel panel-default project-item grad">
									<div class="panel-heading">
										<p class="panel-title">{{name['name'][0]}}</p>
										<div class="right">
											<span class="label label-primary">PROCESSING</span>
											<!-- <span class="label label-success">PROCESSED</span> -->
										</div>
									</div>
									<div class="panel-body">
										<div class="left">
											<div class="info">
												<span class="title">DATE ADDED</span>
												<span class="value">7/25/2018</span>
											</div>
											<div class="info">
												<span class="title">DISTANCE</span>
												<span class="value">EUCLIDEAN</span>
											</div>
											<div class="info">
												<span class="title">RNG</span>
												<span class="value">FILTERED</span>
											</div>
											<div class="info">
												<span class="title">MPTS MIN/MAX</span>
												<span class="value">2/50</span>
											</div>
										</div>
										<div class="left">
											<div class="info">
												<span class="title">POINTS</span>
												<span class="value">{{name['points']}}</span>
											</div>
										</div>
										<div class="right">
											<div class="progress-chart easy-pie-chart" data-percent="{{name['val']}}">
												<span class="percent">{{name['val']}}%</span>
											</div>
											<!-- <div class="task">
												<div class="task-progress">35m Remaing...</div>
											</div> -->
										</div>
										<div class="clearfix"></div>
										<div class="controls">
											<a href="#">
												<i class="fa fa-file-archive-o"></i>Export Zip</a>
											<a href="#">
												<i class="fa fa-trash"></i>Delete</a>
											<button type="button" class="btn btn-default pull-right" disabled>
												<i class="fa fa-area-chart"></i>OPEN</button>
										</div>
									</div>
								</div>
							</div>
						{% endfor %}