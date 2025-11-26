export default function AboutPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="bg-white rounded-lg shadow p-6 md:p-8 border border-gray-200">
						<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
							About PickMonster
						</h1>
						<div className="prose prose-gray max-w-none">
							<div className="mb-6">
								<img
									src="/assets/doug-lola.webp"
									alt="Doug Rogers with his cat Lola"
									className="w-full max-w-md rounded-lg shadow-md"
								/>
								<p className="text-sm text-gray-500 mt-2">Doug & Lola (c. 2024)</p>
							</div>
							<p className="text-lg text-gray-700 mb-4">
								Hey, I'm Doug. I'm a developer from Boston now living in the East Bay
								near Berkeley.
							</p>
							<p className="text-gray-600 mb-4">
								I made PickMonster because the Yahoo Pick'em app sucks and hasn't been
								updated in like 10 years. As someone who's been playing NFL pick'em
								games for years, I got tired of the clunky interface, lack of modern
								features, and general neglect of the platform.
							</p>
							<p className="text-gray-600 mb-4">
								With over 25 years of experience in the tech industry, I specialize in
								building modern web applications. My background spans software
								development, product design, and general engineering. I enjoy combining
								these disciplines to create innovative solutions.
							</p>
							<p className="text-gray-600">
								PickMonster is my attempt to build a better pick'em experience—one that's
								fast, modern, mobile-friendly, and actually gets updated. I hope you enjoy
								using it as much as I enjoyed building it.
							</p>
							<div className="mt-8 pt-6 border-t border-gray-200">
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Let's Connect
								</h2>
								<p className="text-gray-600 mb-4">
									Want to chat about PickMonster, pick'em strategies, or just say hello?
									Feel free to reach out.
								</p>
								<div className="flex flex-wrap gap-4">
									<a
										href="https://github.com/afxjzs"
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700 transition-colors"
									>
										GitHub
									</a>
									<a
										href="https://linkedin.com/in/douglasrogers"
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700 transition-colors"
									>
										LinkedIn
									</a>
									<a
										href="https://doug.is"
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700 transition-colors"
									>
										doug.is
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}

