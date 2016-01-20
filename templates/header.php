<!DOCTYPE html>
<html>
	<head>
		<link rel="stylesheet" href="style.css">
		<title><?= htmlspecialchars($title) ?></title>
	</head>
	<body>
		<div class="wrapper">
			<header>
				<h1>Caleb Jay Rogers</h1>
				<nav>
					<ul>
						<li><a href="index.php" class="<?php if(basename($_SERVER['SCRIPT_NAME']) == 'index.php'){echo 'current'; }else { echo ''; } ?>">Home</a></li>
						<li><a href="resume.php" class="<?php if(basename($_SERVER['SCRIPT_NAME']) == 'resume.php'){echo 'current'; }else { echo ''; } ?>">Resume</a></li>
						<li><a href="writing.php" class="<?php if(basename($_SERVER['SCRIPT_NAME']) == 'writing.php'){echo 'current'; }else { echo ''; } ?>">Writing</a></li>
						<li><a href="programming.php" class="<?php if(basename($_SERVER['SCRIPT_NAME']) == 'programming.php'){echo 'current'; }else { echo ''; } ?>">Programming</a></li>
					</ul>
				</nav>
			</header>