// PM2 Ecosystem Configuration for Bluehost Deployment
// Update the 'cwd' path to match your Bluehost deployment directory

module.exports = {
	apps: [{
		name: 'pickem-app',
		script: 'node_modules/next/dist/bin/next',
		args: 'start',
		cwd: '/home/YOUR_USERNAME/public_html/pickem', // UPDATE THIS PATH
		instances: 1,
		exec_mode: 'fork',
		env: {
			NODE_ENV: 'production',
			PORT: 3000,
			NEXT_TELEMETRY_DISABLED: 1
		},
		error_file: './logs/err.log',
		out_file: './logs/out.log',
		log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
		merge_logs: true,
		autorestart: true,
		watch: false,
		max_memory_restart: '1G'
	}]
}



