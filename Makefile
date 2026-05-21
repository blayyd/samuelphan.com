.PHONY: build notes photos clean

# Build the full content pipeline (notes + photos)
build:
	python3 build.py

# Build notes manifest only
notes:
	python3 build.py notes

# Build photos manifest only
photos:
	python3 build.py photos

# Remove generated outputs (content stays)
clean:
	rm -f data/notes.json assets/photos.json
	@echo "Clean complete."
